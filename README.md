# NestJS Template

## Project Structure

```
.
├── database                     // database migration/seeders
├── docker                       // Local docker configuration
├── src                          // Application
│   ├── [domain]                 // Module for specific domain
│   │   ├── commands             // CLI commands
│   │   ├── controllers          // API endpoint routing
│   │   ├── dtos                 // Data Transfer Objects
│   │   ├── entities             // Database entities
│   │   ├── enums                
│   │   ├── events               
│   │   ├── filters              // https://docs.nestjs.com/exception-filters
│   │   ├── helpers              // Dynamic helper services
│   │   ├── interceptors         // https://docs.nestjs.com/interceptors
│   │   ├── interfaces           
│   │   ├── mappers              
│   │   ├── middleware           
│   │   ├── models               // Business layer classes
│   │   ├── repositories         // Database services
│   │   ├── services             // Main business services
│   │   ├── types                
│   │   ├── utilities            // Static helper services
│   │   └── DomainModule.ts      // Domain module
│   ├── AppImports.ts            // Root module imports
│   ├── AppModule.ts             // Root module
│   ├── cli.ts                   // Root cli tool
│   ├── EnvironmentSetter.ts     // Environment setter middleware
│   ├── main.ts                  // Root server file
├── test                         // Test suite
├── .env.example                 // Environment template file
├── .eslintrc.js                 // ESLint(https://eslint.org/) configuration file
├── .prettierrc                  // Prettier(https://prettier.io/) configuration file
├── docker-compose.yml           // Docker Compose configuration file
├── Dockerfile                   // Docker image configration file
├── mikro-orm.config.ts          // ORM configuration
├── package.json                 // Node dependency manager and runnable script command location
├── tsconfig.json                // TypeScript configuration
```   
