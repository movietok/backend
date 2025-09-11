#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * Environment switcher script
 * 
 * Usage:
 * node scripts/switch-env.js development
 * node scripts/switch-env.js production
 * node scripts/switch-env.js test
 */

const environments = ['development', 'production', 'test'];
const targetEnv = process.argv[2];

if (!targetEnv) {
  console.log('❌ Please specify an environment:');
  console.log('   node scripts/switch-env.js development');
  console.log('   node scripts/switch-env.js production');
  console.log('   node scripts/switch-env.js test');
  process.exit(1);
}

if (!environments.includes(targetEnv)) {
  console.log(`❌ Invalid environment: ${targetEnv}`);
  console.log(`   Valid environments: ${environments.join(', ')}`);
  process.exit(1);
}

const rootDir = process.cwd();
const sourceFile = path.join(rootDir, `.env.${targetEnv}`);
const targetFile = path.join(rootDir, '.env');

try {
  // Check if source environment file exists
  if (!fs.existsSync(sourceFile)) {
    console.log(`⚠️  Environment file not found: .env.${targetEnv}`);
    console.log('   Creating from template...');
    
    // Create from example
    const exampleFile = path.join(rootDir, '.env.example');
    if (fs.existsSync(exampleFile)) {
      let content = fs.readFileSync(exampleFile, 'utf8');
      content = content.replace(/NODE_ENV=development/, `NODE_ENV=${targetEnv}`);
      fs.writeFileSync(sourceFile, content);
      console.log(`✅ Created .env.${targetEnv} from template`);
    } else {
      console.log('❌ No .env.example template found');
      process.exit(1);
    }
  }

  // Backup current .env if it exists
  if (fs.existsSync(targetFile)) {
    const backupFile = path.join(rootDir, '.env.backup');
    fs.copyFileSync(targetFile, backupFile);
    console.log('💾 Backed up current .env to .env.backup');
  }

  // Copy environment-specific file to .env
  fs.copyFileSync(sourceFile, targetFile);
  
  console.log(`🔄 Switched to ${targetEnv} environment`);
  console.log(`📁 Active configuration: .env.${targetEnv} → .env`);
  
  // Validate the new configuration
  console.log('\n🔍 Validating configuration...');
  
  // Import and validate config
  import('../src/config/config.js').then(configModule => {
    const config = configModule.default;
    try {
      config.validateConfig();
      console.log('✅ Configuration is valid');
      
      // Print summary
      console.log('\n📋 Environment Summary:');
      console.log(`   Environment: ${config.environment}`);
      console.log(`   Database: ${config.getDatabaseConfig().database}`);
      console.log(`   Port: ${config.getServerConfig().port}`);
      
    } catch (error) {
      console.log(`❌ Configuration error: ${error.message}`);
      console.log('   Please check your environment variables');
    }
  }).catch(error => {
    console.log('⚠️  Could not validate configuration:', error.message);
  });

} catch (error) {
  console.log(`❌ Error switching environment: ${error.message}`);
  process.exit(1);
}
