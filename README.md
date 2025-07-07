Shield: [![CC BY-NC-ND 4.0][cc-by-nc-nd-shield]][cc-by-nc-nd]
# Atlas Networks Roleplay Web Server

A comprehensive multi-domain web application server for Atlas Networks Roleplay community management, featuring Discord OAuth integration and modular service architecture.


## 🚀 Features

- **Multi-Domain Architecture**: Uses virtual hosting to serve different applications on different subdomains
- **Discord OAuth Integration**: Secure authentication through Discord using Passport.js
- **Modular Design**: Separate applications for different functionalities
- **Database Integration**: MySQL2 support for data persistence
- **Comprehensive Logging**: Automatic request logging and console output capture
- **Session Management**: Secure session handling with Express Session

## 🏗️ Architecture

The server hosts multiple applications on different subdomains:

- **Staff Portal** (`staff.atlasnetworksroleplay.com`) - Staff management and administration
- **Ban Management** (`bans.atlasnetworksroleplay.com`) - Ban tracking and management
- **Appeals System** (`appeals.atlasnetworksroleplay.com`) - Appeal submission and processing
- **Main Site** (`atlasnetworksroleplay.com`) - Primary website

## 📁 Project Structure

```
├── index.js                 # Main server entry point
├── package.json             # Dependencies and scripts
├── appeals/                 # Appeals management system
│   ├── app.js              # Appeals app configuration
│   ├── middleware/         # Authentication and database middleware
│   ├── routes/             # Appeal routing logic
│   └── views/              # EJS templates for appeals
├── bans/                   # Ban management system
│   ├── app.js              # Bans app configuration
│   ├── middleware/         # Authentication and utilities
│   ├── routes/             # Ban management routes
│   └── views/              # EJS templates for bans
├── staff/                  # Staff portal
│   ├── app.js              # Staff app configuration
│   ├── middleware/         # Staff-specific middleware
│   ├── routes/             # Staff management routes
│   └── views/              # EJS templates for staff
└── root/                   # Main website
    ├── app.js              # Root app configuration
    └── views/              # Main site templates
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AtlasWebserver
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=3000
   DOMAIN=atlasnetworksroleplay.com
   
   # Session Security
   SESSION_SECRET=your-super-secret-session-key
   
   # Discord OAuth
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_CLIENT_SECRET=your-discord-client-secret
   DISCORD_CALLBACK_URL=https://staff.atlasnetworksroleplay.com/auth/discord/callback
   
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=your-database-name
   
   # Bot Configuration (if applicable)
   BOT_TOKEN=your-discord-bot-token
   ```

4. **Database Setup**
   
   Ensure you have MySQL running and create the necessary database and tables for your application.

## 🚀 Usage

1. **Start the server**
   ```bash
   npm start
   ```

2. **Development**
   ```bash
   node index.js
   ```

The server will start on the configured port (default: 3000) and serve different applications based on the hostname.

## 🔧 Configuration

### Virtual Host Configuration

The server uses `vhost` middleware to route requests to different applications based on the hostname:

- Staff portal: `staff.atlasnetworksroleplay.com`
- Ban management: `bans.atlasnetworksroleplay.com`
- Appeals system: `appeals.atlasnetworksroleplay.com`
- Main site: `atlasnetworksroleplay.com`

### Authentication

Each service that requires authentication uses Discord OAuth through Passport.js. Users are authenticated through their Discord accounts and permissions are managed based on Discord roles.

### Logging

The application automatically creates timestamped log files in the `logs/` directory, capturing both HTTP requests and console output.

## 🔒 Security Features

- **Discord OAuth Integration**: Secure authentication through Discord
- **Session Management**: Encrypted session storage
- **Role-Based Access Control**: Admin and authentication middleware
- **Input Validation**: Express built-in and custom validation

## 🧩 Dependencies

### Core Dependencies
- **Express.js**: Web application framework
- **EJS**: Templating engine
- **Passport.js**: Authentication middleware
- **Discord.js**: Discord API integration
- **MySQL2**: Database connectivity
- **Express Session**: Session management
- **Morgan**: HTTP request logging
- **VHost**: Virtual host routing

## 📝 Development

### Adding New Routes

1. Create route files in the appropriate `/routes` directory
2. Create corresponding view templates in `/views`
3. Register routes in the respective `app.js` file

### Adding New Middleware

1. Create middleware files in `/middleware` directory
2. Import and use in the respective application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**: Change the PORT in your `.env` file
2. **Database connection issues**: Verify your database credentials in `.env`
3. **Discord OAuth errors**: Check your Discord application settings and callback URLs
4. **Permission denied**: Ensure proper file permissions for log directory

### Debugging

The application includes comprehensive logging. Check the `logs/` directory for detailed request logs and error information.

## 📄 License
This work is licensed under a
[Creative Commons Attribution-NonCommercial-NoDerivs 4.0 International License][cc-by-nc-nd].

[![CC BY-NC-ND 4.0][cc-by-nc-nd-image]][cc-by-nc-nd]

[cc-by-nc-nd]: http://creativecommons.org/licenses/by-nc-nd/4.0/
[cc-by-nc-nd-image]: https://licensebuttons.net/l/by-nc-nd/4.0/88x31.png
[cc-by-nc-nd-shield]: https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey.svg
See the [LICENSE.md](LICENSE.md) file for details.

## 🔗 Links

- [Atlas Networks Roleplay](https://atlasnetworksroleplay.com)
- [Discord Server](https://discord.gg/atlasnetworks)

## 📞 Support

For support, please contact the Atlas Networks development team or create an issue in this repository.

---

**Atlas Networks Roleplay** - Building immersive roleplay experiences through technology.
