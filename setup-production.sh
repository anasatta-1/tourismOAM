#!/bin/bash

echo "=========================================="
echo "Production Setup Script"
echo "=========================================="
echo ""

# Create upload directories
echo "Creating upload directories..."
mkdir -p uploads/passports
mkdir -p uploads/receipts
mkdir -p uploads/quotations
mkdir -p uploads/contracts
mkdir -p logs

# Set permissions
echo "Setting permissions..."
chmod 755 uploads uploads/* 2>/dev/null
chmod 755 logs
chmod 600 api/config.php 2>/dev/null

# Create .htaccess files if they don't exist
if [ ! -f uploads/.htaccess ]; then
    echo "Creating uploads/.htaccess..."
    cat > uploads/.htaccess << 'EOF'
<FilesMatch "\.php$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
Options -Indexes
EOF
fi

if [ ! -f logs/.htaccess ]; then
    echo "Creating logs/.htaccess..."
    echo "Order Allow,Deny" > logs/.htaccess
    echo "Deny from all" >> logs/.htaccess
fi

# Create .env file from example if it doesn't exist
if [ ! -f api/.env ]; then
    if [ -f api/.env.example ]; then
        echo "Creating api/.env from example..."
        cp api/.env.example api/.env
        chmod 600 api/.env
        echo "⚠️  IMPORTANT: Edit api/.env with your production settings!"
    fi
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit api/.env with your production database credentials"
echo "2. Set PRODUCTION=true in api/.env or .htaccess"
echo "3. Update ALLOWED_ORIGINS in api/.env with your domain"
echo "4. Change default admin password (username: admin)"
echo "5. Remove or protect test files (test-api.html, test-*.php)"
echo "6. Enable HTTPS and uncomment HTTPS redirect in .htaccess"
echo ""

