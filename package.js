import { zip } from "zip-a-folder";
import fs from 'fs';
import path from 'path';

async function packageExtension() {
  try {
    console.log('📦 Packaging SmritiAI extension...');
    
    // Ensure dist directory exists
    if (!fs.existsSync('dist')) {
      console.error('❌ dist directory not found. Run "npm run build" first.');
      process.exit(1);
    }
    
    // Create extension zip with timestamp
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const zipName = `SmritiAI-${timestamp}.zip`;
    
    console.log(`📁 Zipping contents of 'dist/' directory...`);
    await zip('dist', zipName);
    
    console.log(`✅ Extension packaged successfully: ${zipName}`);
    console.log('📤 Ready to upload to Firefox Add-ons store!');
    
    // Show file size
    const stats = fs.statSync(zipName);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 File size: ${sizeInMB} MB`);
    
    // Show what was packaged
    console.log('\n📋 Package contents:');
    const distFiles = fs.readdirSync('dist', { withFileTypes: true });
    distFiles.forEach(file => {
      if (file.isDirectory()) {
        console.log(`  📁 ${file.name}/`);
        const subFiles = fs.readdirSync(path.join('dist', file.name));
        subFiles.forEach(subFile => {
          console.log(`    📄 ${subFile}`);
        });
      } else {
        console.log(`  📄 ${file.name}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Packaging failed:', error);
    process.exit(1);
  }
}

packageExtension();

