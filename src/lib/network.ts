import type {
  PingResult,
  DnsResult,
  DownloadResult,
  UploadResult,
  ConnectivityResult,
  TracerouteResult,
  TracerouteHop,
  NetworkInfo,
} from '@/types';

const TIMEOUT = 8000;

function timeoutPromise<T>(ms: number, fallback: T, promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

const PING_TARGETS = ['1.1.1.1', '8.8.8.8', '208.67.222.222'];

/**
 * Measure latency to a host using the Image loading technique.
 * Works cross-origin (no CORS needed). Both onload and onerror
 * fire after the TCP/TLS round trip completes, so we get a real
 * latency measurement even if the server returns an error.
 * Returns null only on timeout.
 */
function imagePing(host: string, path: string, timeoutMs: number): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const start = performance.now();

    const cleanup = (result: number | null) => {
      if (done) return;
      done = true;
      img.src = '';
      resolve(result);
    };

    img.onload = () => cleanup(Math.round(performance.now() - start));
    img.onerror = () => cleanup(Math.round(performance.now() - start));
    setTimeout(() => cleanup(null), timeoutMs);
    img.src = `https://${host}${path}?t=${Date.now()}-${Math.random()}`;
  });
}

/**
 * Fallback latency measurement using fetch with no-cors.
 * Used when Image loading doesn't work for a particular host.
 */
async function fetchPing(host: string, timeoutMs: number): Promise<number | null> {
  const start = performance.now();
  try {
    const result = await timeoutPromise(
      timeoutMs,
      null,
      fetch(`https://${host}/favicon.ico?t=${Date.now()}`, {
        mode: 'no-cors',
        cache: 'no-store',
      }).then(() => true)
    );
    if (result) {
      return Math.round(performance.now() - start);
    }
    return null;
  } catch {
    return null;
  }
}

export async function runPing(
  host: string = '1.1.1.1',
  count = 20,
  onProgress?: (latencies: number[], lost: number) => void
): Promise<PingResult> {
  const cleanHost = host
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/ping?host=${encodeURIComponent(cleanHost)}&count=${count}`
    );

    if (!response.ok) {
      throw new Error(`Ping agent HTTP ${response.status}`);
    }

    const data = await response.json();
    const output = String(data.output || '');

    // Example:
    // Reply from 1.1.1.1: bytes=32 time=61ms TTL=55
    const latencies = Array.from(
      output.matchAll(/time[=<]\s*(\d+(?:\.\d+)?)\s*ms/gi),
      (match) => Math.round(Number(match[1]))
    );

    // Example:
    // Lost = 1 (25% loss)
    const lossMatch = output.match(
      /Lost\s*=\s*(\d+)\s*\((\d+(?:\.\d+)?)%\s*loss\)/i
    );

    const lost = lossMatch
      ? Number(lossMatch[1])
      : Math.max(0, count - latencies.length);

    onProgress?.([...latencies], lost);

    // Windows ping statistics
    const statsMatch = output.match(
      /Minimum\s*=\s*(\d+)ms,\s*Maximum\s*=\s*(\d+)ms,\s*Average\s*=\s*(\d+)ms/i
    );

    const min = statsMatch
      ? Number(statsMatch[1])
      : latencies.length > 0
        ? Math.min(...latencies)
        : 0;

    const max = statsMatch
      ? Number(statsMatch[2])
      : latencies.length > 0
        ? Math.max(...latencies)
        : 0;

    const avg = statsMatch
      ? Number(statsMatch[3])
      : latencies.length > 0
        ? Math.round(
            latencies.reduce((sum, value) => sum + value, 0) /
              latencies.length
          )
        : 0;

    const jitter =
      latencies.length > 1
        ? Math.round(
            latencies
              .slice(1)
              .reduce(
                (sum, latency, index) =>
                  sum + Math.abs(latency - latencies[index]),
                0
              ) /
              (latencies.length - 1)
          )
        : 0;

    const packetLoss = lossMatch
      ? Math.round(Number(lossMatch[2]))
      : Math.round((lost / count) * 100);

    return {
      host: cleanHost,
      latencies,
      min,
      max,
      avg,
      jitter,
      packetLoss,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Local ping agent error:', error);

    onProgress?.([], count);

    return {
      host: cleanHost,
      latencies: [],
      min: 0,
      max: 0,
      avg: 0,
      jitter: 0,
      packetLoss: 100,
      timestamp: Date.now(),
    };
  }
}

// Speed test endpoints — user can choose which server to test against
export const SPEED_SERVERS = [
  { name: 'Cloudflare', downloadUrl: 'https://speed.cloudflare.com/__down?bytes=25000000', uploadUrl: 'https://speed.cloudflare.com/__up' },
  { name: 'Fast.com', downloadUrl: 'https://fast.com/app.speedtest.net/api/__down?bytes=25000000', uploadUrl: '' },
];

const DOWNLOAD_SIZE = 25_000_000;

export async function runDownload(serverUrl?: string): Promise<DownloadResult> {
  const url = serverUrl || SPEED_SERVERS[0].downloadUrl;
  const start = performance.now();
  let bytesDownloaded = 0;

  try {
    const res = await timeoutPromise(TIMEOUT, null, fetch(url, { cache: 'no-store' }));
    if (res && res.body) {
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesDownloaded += value?.length ?? 0;
      }
    }
  } catch {
    // ignore
  }

  const durationMs = performance.now() - start;
  const speedMbps =
    bytesDownloaded > 0 ? (bytesDownloaded * 8) / (durationMs / 1000) / 1_000_000 : 0;

  return {
    speedMbps: Math.round(speedMbps * 100) / 100,
    durationMs: Math.round(durationMs),
    bytesDownloaded,
    timestamp: Date.now(),
  };
}

export async function runUpload(serverUrl?: string): Promise<UploadResult> {
  const url = serverUrl || SPEED_SERVERS[0].uploadUrl;
  if (!url) {
    return { speedMbps: 0, durationMs: 0, bytesUploaded: 0, timestamp: Date.now() };
  }
  const payloadSize = 10_000_000;
  const payload = new Blob([new Uint8Array(payloadSize)]);
  const start = performance.now();
  let bytesUploaded = payloadSize;

  try {
    await timeoutPromise(
      TIMEOUT,
      null,
      fetch(url, { method: 'POST', body: payload, cache: 'no-store' })
    );
  } catch {
    bytesUploaded = 0;
  }

  const durationMs = performance.now() - start;
  const speedMbps =
    bytesUploaded > 0 ? (bytesUploaded * 8) / (durationMs / 1000) / 1_000_000 : 0;

  return {
    speedMbps: Math.round(speedMbps * 100) / 100,
    durationMs: Math.round(durationMs),
    bytesUploaded,
    timestamp: Date.now(),
  };
}

export async function runSpeedTest(serverIndex = 0): Promise<{
  download: DownloadResult;
  upload: UploadResult;
}> {
  const server = SPEED_SERVERS[serverIndex] || SPEED_SERVERS[0];
  const download = await runDownload(server.downloadUrl);
  const upload = await runUpload(server.uploadUrl);
  return { download, upload };
}

// DNS-over-HTTPS servers that support CORS for browser queries
const DNS_SERVERS = [
  { name: 'Google (8.8.8.8)', url: 'https://dns.google/resolve' },
  { name: 'Cloudflare (1.1.1.1)', url: 'https://cloudflare-dns.com/dns-query' },
  { name: 'Quad9 (9.9.9.9)', url: 'https://dns.quad9.net:5053/dns-query' },
];

export async function runDnsTest(
  server: string,
  domain: string
): Promise<DnsResult> {
  const start = performance.now();

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/dns?domain=${encodeURIComponent(domain)}`
    );

    if (!response.ok) {
      throw new Error(`DNS agent HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      server,
      domain: data.domain ?? domain,
      responseTime: Math.round(Number(data.response_time_ms ?? 0)),
      success: Boolean(data.success),
      address: data.addresses?.[0] ?? null,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Local DNS agent error:', error);

    return {
      server,
      domain,
      responseTime: Math.round(performance.now() - start),
      success: false,
      address: null,
      timestamp: Date.now(),
    };
  }
}


export async function runDnsBatch(domain: string): Promise<DnsResult[]> {
  const results: DnsResult[] = [];

  for (const server of DNS_SERVERS) {
    const result = await runDnsTest(server.name, domain);

    results.push(result);
  }

  return results;
}

/**
 * Connectivity test:
 * - TCP/TLS reachability via Image loading (cross-origin safe)
 * - HTTP response via no-cors fetch (if it resolves, HTTP is working)
 * - Fallback: Image loading as HTTP reachability if fetch fails
 */
export async function runConnectivity(host: string, port: number): Promise<ConnectivityResult> {
  const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const scheme = port === 80 ? 'http' : 'https';

  // TCP/TLS connectivity via Image loading (always uses https)
  let tcpConnectTime: number | null = null;
  let tcpSuccess = false;

  const tcpResult = await imagePing(cleanHost, '/favicon.ico', 5000);
  if (tcpResult !== null) {
    tcpConnectTime = tcpResult;
    tcpSuccess = true;
  }

  // HTTP/HTTPS response test
  let httpResponseTime: number | null = null;
  let httpStatusCode: number | null = null;
  let httpSuccess = false;

  const httpStart = performance.now();
  try {
    const res = await timeoutPromise(
      5000,
      null,
      fetch(`${scheme}://${cleanHost}/`, {
        mode: 'no-cors',
        cache: 'no-store',
        redirect: 'follow',
      })
    );
    if (res) {
      httpResponseTime = Math.round(performance.now() - httpStart);
      httpStatusCode = res.type === 'opaque' ? 200 : res.status;
      httpSuccess = true;
    }
  } catch {
    // fetch failed — try Image loading as a fallback for HTTP reachability
    if (tcpSuccess && httpResponseTime === null) {
      const imgResult = await imagePing(cleanHost, '/', 5000);
      if (imgResult !== null) {
        httpResponseTime = imgResult;
        httpStatusCode = 200;
        httpSuccess = true;
      }
    }
  }

  // If fetch resolved but returned null (timeout), use image fallback
  if (!httpSuccess && tcpSuccess) {
    const imgResult = await imagePing(cleanHost, '/', 5000);
    if (imgResult !== null) {
      httpResponseTime = imgResult;
      httpStatusCode = 200;
      httpSuccess = true;
    }
  }

  return {
    host: cleanHost,
    port: port === 80 ? 80 : 443,
    tcpConnectTime,
    tcpSuccess,
    httpResponseTime,
    httpStatusCode,
    httpSuccess,
    timestamp: Date.now(),
  };
}



/**
 * Traceroute simulation using Image loading to time each hop.
 * Browsers can't do real traceroute (no raw sockets / TTL control),
 * so we probe known intermediate hosts and the final target.
 */
const TRACEROUTE_INTERMEDIATE = [
  { label: 'Local Gateway', host: '1.1.1.1' },
  { label: 'ISP Edge', host: '8.8.8.8' },
  { label: 'Backbone', host: '208.67.222.222' },
  { label: 'CDN Edge', host: '1.0.0.1' },
];

export async function runTraceroute(
  target: string,
  onProgress?: (hop: number, totalHops: number) => void
): Promise<TracerouteResult> {
  const cleanTarget = target.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const hops: TracerouteHop[] = [];
  const totalHops = TRACEROUTE_INTERMEDIATE.length + 1;

  for (let i = 0; i < TRACEROUTE_INTERMEDIATE.length; i++) {
    onProgress?.(i + 1, totalHops);
    const start = performance.now();
    let success = false;
    let latency = 0;

    const result = await imagePing(TRACEROUTE_INTERMEDIATE[i].host, '/favicon.ico', 3000);
    latency = result ?? Math.round(performance.now() - start);
    success = result !== null;

    hops.push({
      hop: i + 1,
      host: TRACEROUTE_INTERMEDIATE[i].label,
      latency,
      success,
    });
    await new Promise((r) => setTimeout(r, 200));
  }

  // Final hop: the actual target
  onProgress?.(totalHops, totalHops);
  const start = performance.now();
  let success = false;
  let latency = 0;

  const result = await imagePing(cleanTarget, '/favicon.ico', 3000);
  latency = result ?? Math.round(performance.now() - start);
  success = result !== null;

  hops.push({
    hop: hops.length + 1,
    host: cleanTarget,
    latency,
    success,
  });

  return { target: cleanTarget, hops, timestamp: Date.now() };
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  let publicIp = 'Unknown';
  let localIp = 'Unknown';
  let gateway = 'Unknown';

  // Public IP — try multiple sources
  const ipSources = [
    'https://api.ipify.org?format=json',
    'https://ipapi.co/json/',
  ];

  for (const src of ipSources) {
    if (publicIp !== 'Unknown') break;
    try {
      const res = await timeoutPromise(5000, null, fetch(src, { cache: 'no-store' }));
      if (res && res.ok) {
        const data = await res.json();
        publicIp = data.ip || 'Unknown';
      }
    } catch {
      // try next source
    }
  }

  // Local IP via WebRTC ICE candidates
  try {
    const rtc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    rtc.createDataChannel('');

    const iceCandidates = await new Promise<RTCIceCandidate[]>((resolve) => {
      const candidates: RTCIceCandidate[] = [];
      const timeout = setTimeout(() => resolve(candidates), 3000);

      rtc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate);
        } else {
          clearTimeout(timeout);
          resolve(candidates);
        }
      };

      rtc.createOffer().then((offer) => {
        rtc.setLocalDescription(offer);
      });
    });

    rtc.close();

    const ipv4Regex = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g;
    const allIps: string[] = [];
    for (const candidate of iceCandidates) {
      const matches = candidate.candidate.match(ipv4Regex);
      if (matches) allIps.push(...matches);
    }

    const validIps = allIps.filter(
      (ip) => !ip.startsWith('0.') && ip !== '127.0.0.1' && !ip.startsWith('169.254.')
    );

    const privateIp = validIps.find(
      (ip) =>
        ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        (ip.startsWith('172.') && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31)
    );

    if (privateIp) localIp = privateIp;

    if (privateIp) {
      const subnet = privateIp.split('.').slice(0, 3).join('.');
      const gatewayCandidate = validIps.find((ip) => ip === `${subnet}.1`);
      gateway = gatewayCandidate || `${subnet}.1`;
    }

    if (localIp === 'Unknown' && validIps.length > 0) {
      localIp = validIps[0];
    }
  } catch {
    // WebRTC not available
  }

  return { localIp, publicIp, gateway, timestamp: Date.now() };
}

export { PING_TARGETS, DNS_SERVERS, DOWNLOAD_SIZE };
