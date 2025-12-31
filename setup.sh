#!/bin/bash

if [[ $EUID -ne 0 ]]; then
   echo "Harus dijalankan sebagai root (sudo bash setup.sh)"
   exit 1
fi

read -p "Masukkan nama domain (contoh: ytdlp.alxzyy.my.id): " DOMAIN

apt update && apt upgrade -y

apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_current.x | bash -
apt install -y nodejs

apt install -y \
    ca-certificates fonts-liberation libasound2t64 libatk-bridge2.0-0 libc6 libcairo2 \
    libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc-s1 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
    libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

apt install -y fonts-noto-color-emoji fonts-noto-cjk fonts-freefont-ttf nginx certbot python3-certbot-nginx

mkdir -p /usr/local/share/fonts/apple
wget -O /usr/local/share/fonts/apple/apple-emoji.ttf https://github.com/samuelngs/apple-emoji-linux/releases/latest/download/AppleColorEmoji.ttf
fc-cache -f -v

npm install

npx puppeteer browsers install chrome

cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email

echo "Setup selesai! Domain $DOMAIN sudah aktif dengan HTTPS di port 3000."
