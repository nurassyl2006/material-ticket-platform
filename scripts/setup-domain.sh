#!/usr/bin/env bash
# ==============================================================================
# Domain & Nginx Reverse Proxy Setup Script for ardingly.service.kz
# Run on the server: bash scripts/setup-domain.sh
# ==============================================================================

set -e

DOMAIN="ardingly.service.kz"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF_SRC="$REPO_DIR/scripts/nginx-ardingly.conf"
CONF_DEST="/etc/nginx/sites-available/$DOMAIN"
CONF_LINK="/etc/nginx/sites-enabled/$DOMAIN"

echo "=================================================="
echo "🌐 Setting up domain $DOMAIN for EduOps"
echo "=================================================="

# 1. Install Nginx if not installed
if ! command -v nginx >/dev/null 2>&1; then
  echo "📦 Installing Nginx..."
  sudo apt-get update
  sudo apt-get install -y nginx
fi

# 2. Copy Nginx configuration
echo "⚙️ Configuring Nginx reverse proxy (port 80 -> port 5001)..."
sudo cp "$CONF_SRC" "$CONF_DEST"

# 3. Enable site
if [ ! -f "$CONF_LINK" ]; then
  sudo ln -s "$CONF_DEST" "$CONF_LINK"
fi

# Remove default site if it exists and conflicts
if [ -f "/etc/nginx/sites-enabled/default" ]; then
  echo "ℹ️ Disabling default Nginx welcome page..."
  sudo rm -f "/etc/nginx/sites-enabled/default"
fi

# 4. Test Nginx syntax
echo "🔍 Testing Nginx configuration..."
sudo nginx -t

# 5. Reload Nginx
echo "🔄 Reloading Nginx service..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# 6. Add local DNS resolution to /etc/hosts on this machine
if ! grep -q "$DOMAIN" /etc/hosts; then
  echo "127.0.0.1 $DOMAIN" | sudo tee -a /etc/hosts >/dev/null
  echo "✅ Added $DOMAIN to local /etc/hosts"
fi

echo ""
echo "=================================================="
echo "🎉 Setup complete! Nginx is now proxying:"
echo "   http://$DOMAIN -> http://127.0.0.1:5001"
echo ""
echo "👉 Next steps for network access:"
echo "1. If accessing across the school Wi-Fi/LAN:"
echo "   Ask your network administrator to add a local DNS A-record:"
echo "   $DOMAIN -> 10.1.13.50"
echo ""
echo "2. If accessing from external internet (home/mobile):"
echo "   - Point the DNS A-record of $DOMAIN to your school router's public IP"
echo "   - Port-forward 80 & 443 on the router to 10.1.13.50"
echo "   - Run 'sudo certbot --nginx -d $DOMAIN' to get free HTTPS"
echo "=================================================="
