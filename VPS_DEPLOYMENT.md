# TindahanPOS VPS Deployment Guide (PM2 + Nginx)

This guide takes you through deploying TindahanPOS on a self-hosted Ubuntu Linux VPS using Next.js standalone build, PM2 for process management, and Nginx as a reverse proxy.

## 1. Initial VPS Setup
Install the necessary prerequisites: Node.js (v20+ recommended), PM2, and Nginx.

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

## 2. Clone and Build Code
Move to your deployment directory (e.g., `/var/www/tindahanpos`).

```bash
# Clone the repo (replace with your secure SSH/HTTPS method)
git clone https://github.com/pilipjan/TindahanPOS.git /var/www/tindahanpos
cd /var/www/tindahanpos

# Install dependencies Make sure to copy your .env.local file to the server!
npm install

# Build the Next.js application (this triggers the 'standalone' output specified in next.config.ts)
npm run build
```

**Crucial Step:** When Next.js builds in `standalone` mode, it does NOT copy the `public` or `.next/static` folder into the `.next/standalone` directory automatically. You must manually copy them.

```bash
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

## 3. Configure PM2
We've already included `ecosystem.config.js` in the root of the project.

```bash
# Start the application using PM2
pm2 start ecosystem.config.js

# Ensure PM2 restarts on server reboot
pm2 startup
pm2 save
```

## 4. Nginx Reverse Proxy Setup
Your app is now running internally on port `3000`. We need Nginx to listen on port `80` (and `443` for SSL) and proxy traffic to `3000`.

Create an Nginx configure file:
```bash
sudo nano /etc/nginx/sites-available/tindahanpos
```

Paste the following config (replace `yourdomain.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/tindahanpos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. SSL / Let's Encrypt
Use Certbot to easily request an SSL certificate:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

**Congratulations! Your TindahanPOS is now securely hosted and live!**
