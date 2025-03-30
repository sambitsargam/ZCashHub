#!/bin/bash

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
INFO="${BLUE}ℹ${NC}"
SUCCESS="${GREEN}✓${NC}"
ERROR="${RED}✗${NC}"

# Function to print formatted messages
print_step() {
    echo -e "\n${BOLD}Step $1:${NC} $2"
}

print_info() {
    echo -e "${INFO} $1"
}

print_success() {
    echo -e "${SUCCESS} $1"
}

print_error() {
    echo -e "${ERROR} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Welcome message
clear
echo -e "${BOLD}Welcome to NEAR Intents AI Agent Setup!${NC}"
echo -e "This script will guide you through setting up and running your first NEAR intent swap.\n"

# Check Python version
print_step "1" "Checking Python installation"
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python is installed: $PYTHON_VERSION"
else
    print_error "Python 3.8+ is required but not found."
    echo "Please install Python from https://www.python.org/downloads/"
    exit 1
fi

# Check if virtual environment exists
print_step "2" "Setting up Python virtual environment"
if [ ! -d "venv" ]; then
    print_info "Creating virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_info "Virtual environment already exists"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Install requirements
print_step "3" "Installing dependencies"
pip install -r requirements.txt
print_success "Dependencies installed successfully"

# Check for NEAR account
print_step "4" "NEAR Account Setup"
echo -e "Do you already have a NEAR account? (y/n)"
read -r has_account

if [ "$has_account" != "y" ]; then
    echo -e "\n${BOLD}Let's create a NEAR account:${NC}"
    echo "1. Visit https://wallet.near.org"
    echo "2. Click 'Create Account'"
    echo "3. Follow the wallet creation process"
    echo "4. Once created, export your private key"
    echo -e "\nPress enter when you have created your account and have your private key ready..."
    read -r
fi

# Setup account configuration
print_step "5" "Configuring your account"
if [ ! -f "account_file.json" ]; then
    cp account_file.example.json account_file.json
    echo -e "\nPlease enter your NEAR account ID (e.g., your-name.near):"
    read -r account_id
    echo "Please enter your private key (starts with 'ed25519:'):"
    read -r private_key
    
    # Update account_file.json
    sed -i '' "s/your-account.near/$account_id/" account_file.json
    sed -i '' "s/ed25519:your-private-key-here/$private_key/" account_file.json
    print_success "Account configuration saved"
else
    print_info "Account configuration file already exists"
fi

# Setup environment variables
print_step "6" "Setting up environment variables"
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Environment file created"
    
    echo -e "\nWould you like to customize the swap amounts? (y/n)"
    read -r customize_amounts
    
    if [ "$customize_amounts" = "y" ]; then
        echo "Enter NEAR deposit amount (default is 1.0):"
        read -r deposit_amount
        echo "Enter NEAR swap amount (default is 1.0):"
        read -r swap_amount
        
        if [ ! -z "$deposit_amount" ]; then
            sed -i '' "s/NEAR_DEPOSIT_AMOUNT=1.0/NEAR_DEPOSIT_AMOUNT=$deposit_amount/" .env
        fi
        if [ ! -z "$swap_amount" ]; then
            sed -i '' "s/SWAP_AMOUNT=1.0/SWAP_AMOUNT=$swap_amount/" .env
        fi
    fi
else
    print_info "Environment file already exists"
fi

# Final confirmation
print_step "7" "Ready to execute"
echo -e "\n${BOLD}Everything is set up!${NC}"
echo -e "You're about to:"
echo "1. Deposit NEAR tokens for intent operations"
echo "2. Execute a swap from NEAR to USDC"
echo -e "\nWould you like to proceed? (y/n)"
read -r proceed

if [ "$proceed" = "y" ]; then
    print_info "Executing swap..."
    PYTHONPATH=$PYTHONPATH:./src python examples/basic_swap.py
    
    if [ $? -eq 0 ]; then
        print_success "Swap completed successfully!"
        echo -e "\n${BOLD}Next steps:${NC}"
        echo "1. Check your wallet for the completed transaction"
        echo "2. Explore more features in the documentation"
        echo "3. Visit https://docs.near-intents.org for more information"
    else
        print_error "Swap execution failed. Please check the error messages above."
    fi
else
    print_info "Execution cancelled. You can run the script again anytime."
fi

# Deactivate virtual environment
deactivate
print_info "Virtual environment deactivated" 