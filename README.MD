# 🚀 ngrok Setup for Docker Web App (Ubuntu)

This guide explains how to expose a **Docker-based HTTP web app** to the internet securely using **ngrok (HTTPS)** on **Ubuntu**.

---

## ✅ Why this error is normal

> **ngrok is NOT available via `apt` on Ubuntu**

Ubuntu provides ngrok via **Snap**, which is the **official and supported** method.

---

## ✅ Step-by-step ngrok Installation & Setup

### 1️⃣ Check if Snap is available

```bash
snap version
```

If Snap is not installed:

```bash
sudo apt update
sudo apt install snapd -y
```

---

### 2️⃣ Install ngrok using Snap (OFFICIAL)

```bash
sudo snap install ngrok
```

Expected output:
```
ngrok installed
```

---

### 3️⃣ Verify ngrok installation

```bash
ngrok version
```

You should see version details ✅

---

## 🔑 4️⃣ Add ngrok Auth Token (MANDATORY)

1. Open the **ngrok dashboard**
2. Copy your **Auth Token**
3. Run:

```bash
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

Output:
```
Authtoken saved
```

---

## 🚀 5️⃣ Start ngrok for your Docker app

> Example: Docker app running on **port 5000**

```bash
ngrok http 5000
```

You will see something like:
```
Forwarding  https://abcd-1234.ngrok-free.app -> http://localhost:5000
```

---

## 🌍 6️⃣ Access your HTTPS Web App

Open in browser:

```
https://abcd-1234.ngrok-free.app
```

🎉 Your Docker web app is now **PUBLIC + HTTPS**

---

## ⚠️ Common Ubuntu Server Fixes

### ngrok command not found

Try:

```bash
/snap/bin/ngrok version
```

If it works, add ngrok to PATH:

```bash
sudo ln -s /snap/bin/ngrok /usr/local/bin/ngrok
```

---

## 🧪 Quick Test Checklist

| Check | Command |
|------|--------|
| Container running | `docker ps` |
| App reachable | `curl http://localhost:5000` |
| ngrok running | `ngrok http 5000` |

---

## 🧠 Pro Tips (Camera / Mic Apps)

- HTTPS via ngrok is **required**
- Do **not** use IP address
- Avoid self-signed SSL certificates

---

## 🔜 Optional Next Steps

- ngrok auto-run on reboot
- ngrok with docker-compose
- Fixed domain (paid ngrok)
- Production setup using NGIN
