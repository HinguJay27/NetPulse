export type ViewKey =
  | 'dashboard'
  | 'speed'
  | 'ping'
  | 'dns'
  | 'traceroute'
  | 'connectivity'
  | 'info'
  | 'history';

export interface PingResult {
  host: string;
  latencies: number[];
  min: number;
  max: number;
  avg: number;
  jitter: number;
  packetLoss: number;
  timestamp: number;
}

export interface DnsResult {
  server: string;
  domain: string;
  responseTime: number;
  success: boolean;
  address: string | null;
  timestamp: number;
}

export interface DownloadResult {
  speedMbps: number;
  durationMs: number;
  bytesDownloaded: number;
  timestamp: number;
}

export interface UploadResult {
  speedMbps: number;
  durationMs: number;
  bytesUploaded: number;
  timestamp: number;
}

export interface SpeedTestResult {
  download: DownloadResult;
  upload: UploadResult;
  timestamp: number;
}

export interface ConnectivityResult {
  host: string;
  port: number;
  tcpConnectTime: number | null;
  tcpSuccess: boolean;
  httpResponseTime: number | null;
  httpStatusCode: number | null;
  httpSuccess: boolean;
  timestamp: number;
}

export interface TracerouteHop {
  hop: number;
  host: string;
  latency: number;
  success: boolean;
}

export interface TracerouteResult {
  target: string;
  hops: TracerouteHop[];
  timestamp: number;
}

export interface NetworkInfo {
  localIp: string;
  publicIp: string;
  gateway: string;
  timestamp: number;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  packetLossPct: number;
  dnsMs: number;
}
