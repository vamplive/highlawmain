#!/bin/bash
# 윤정 법률사무소 서버 초기 세팅 스크립트
set -e

echo "=== 1/5 시스템 업데이트 ==="
sudo apt update && sudo apt upgrade -y

echo "=== 2/5 Node.js 20 LTS 설치 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "=== 3/5 Nginx 설치 ==="
sudo apt install -y nginx
sudo systemctl enable nginx

echo "=== 4/5 PM2 설치 ==="
sudo npm install -g pm2

echo "=== 5/5 Certbot (SSL) 설치 ==="
sudo apt install -y certbot python3-certbot-nginx

echo "=== 설치 완료 ==="
node -v
npm -v
nginx -v
pm2 -v
