# envault

> A CLI tool for encrypting and syncing `.env` files across team members using GPG keys.

## Installation

```bash
npm install -g envault
```

## Usage

Initialize envault in your project and add your team's GPG keys:

```bash
# Initialize a new envault config
envault init

# Add a team member's GPG key
envault add-key teammate@example.com

# Encrypt and push your .env file
envault push .env

# Pull and decrypt the latest .env file
envault pull
```

Your `.env` file is encrypted locally using the registered GPG keys before being synced, ensuring secrets are never exposed in plaintext.

### Example Workflow

```bash
# First-time setup
envault init --keyring ./keys
envault add-key alice@company.com bob@company.com

# Daily use
envault push        # encrypt & sync
envault pull        # fetch & decrypt
envault diff        # compare local vs remote
```

## Requirements

- Node.js 16+
- GPG installed and configured on your system

## License

[MIT](./LICENSE)