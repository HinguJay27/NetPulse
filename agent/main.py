from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import platform
import socket
import time
import dns.resolver
import psutil

app = FastAPI(
    title="NetPulse Local Network Agent",
    version="1.0.0"
)

# Allow the React/Vite frontend to communicate with the local agent
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://netpulse-65dz.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# HEALTH
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "online",
        "agent": "NetPulse Local Network Agent",
        "platform": platform.system(),
    }


# ---------------------------------------------------------
# PING
# ---------------------------------------------------------
@app.get("/api/ping")
def ping(host: str = "1.1.1.1", count: int = 4):

    system = platform.system().lower()

    if system == "windows":
        command = ["ping", "-n", str(count), host]
    else:
        command = ["ping", "-c", str(count), host]

    start = time.perf_counter()

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=30
        )

        elapsed = round(
            (time.perf_counter() - start) * 1000,
            2
        )

        return {
            "host": host,
            "success": result.returncode == 0,
            "elapsed_ms": elapsed,
            "output": result.stdout,
            "error": result.stderr,
        }

    except FileNotFoundError:
        return {
            "host": host,
            "success": False,
            "elapsed_ms": None,
            "output": "",
            "error": "Ping command is not available on this server.",
        }

    except subprocess.TimeoutExpired:
        return {
            "host": host,
            "success": False,
            "elapsed_ms": None,
            "output": "",
            "error": "Ping timed out",
        }

    except Exception as e:
        return {
            "host": host,
            "success": False,
            "elapsed_ms": None,
            "output": "",
            "error": str(e),
        }

# ---------------------------------------------------------
# DNS
# ---------------------------------------------------------

@app.get("/api/dns")
def dns_lookup(domain: str = "google.com"):

    start = time.perf_counter()

    try:
        answers = dns.resolver.resolve(domain, "A")

        response_time = round(
            (time.perf_counter() - start) * 1000,
            2
        )

        addresses = [answer.to_text() for answer in answers]

        return {
            "domain": domain,
            "success": True,
            "response_time_ms": response_time,
            "addresses": addresses,
        }

    except Exception as e:

        return {
            "domain": domain,
            "success": False,
            "response_time_ms": None,
            "addresses": [],
            "error": str(e),
        }


# ---------------------------------------------------------
# TCP CONNECTIVITY
# ---------------------------------------------------------

@app.get("/api/connectivity")
def connectivity(
    host: str = "google.com",
    port: int = 443
):

    start = time.perf_counter()

    try:
        sock = socket.create_connection(
            (host, port),
            timeout=5
        )

        elapsed = round(
            (time.perf_counter() - start) * 1000,
            2
        )

        sock.close()

        return {
            "host": host,
            "port": port,
            "success": True,
            "tcp_connect_time_ms": elapsed,
        }

    except Exception as e:

        return {
            "host": host,
            "port": port,
            "success": False,
            "tcp_connect_time_ms": None,
            "error": str(e),
        }


# ---------------------------------------------------------
# NETWORK INFORMATION
# ---------------------------------------------------------

@app.get("/api/network-info")
def network_info():

    hostname = socket.gethostname()

    local_ip = "Unknown"

    try:
        local_ip = socket.gethostbyname(hostname)
    except Exception:
        pass

    interfaces = []

    for interface, addresses in psutil.net_if_addrs().items():

        for address in addresses:

            if address.family == socket.AF_INET:

                interfaces.append({
                    "interface": interface,
                    "ip": address.address,
                    "netmask": address.netmask,
                    "broadcast": address.broadcast,
                })

    return {
        "hostname": hostname,
        "local_ip": local_ip,
        "interfaces": interfaces,
        "platform": platform.system(),
    }


# ---------------------------------------------------------
# TRACEROUTE
# ---------------------------------------------------------

@app.get("/api/traceroute")
def traceroute(
    host: str = "google.com"
):

    system = platform.system().lower()

    if system == "windows":

        command = [
            "tracert",
            "-d",
            "-h",
            "15",
            "-w",
            "1000",
            host
        ]

    else:

        command = [
            "traceroute",
            "-n",
            "-m",
            "15",
            "-w",
            "1",
            host
        ]

    try:

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=40
        )

        return {
            "target": host,
            "success": result.returncode == 0,
            "output": result.stdout,
            "error": result.stderr,
        }

    except subprocess.TimeoutExpired:

        return {
            "target": host,
            "success": False,
            "output": "",
            "error": "Traceroute timed out",
        }


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------

@app.get("/")
def root():

    return {
        "message": "NetPulse Local Network Agent",
        "status": "running",
        "docs": "/docs",
    }