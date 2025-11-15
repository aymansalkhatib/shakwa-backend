#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Import Path Converter from @app to relative paths
 * Converts @app imports to relative paths in NestJS projects
 */
class ImportPathConverter {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.srcDir = options.srcDir || 'src';
    this.libsDir = options.libsDir || 'libs';
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.excludeDirs = options.excludeDirs || ['node_modules', 'dist', 'build', '.git'];
    this.includeExtensions = options.includeExtensions || ['.ts', '.js', '.tsx', '.jsx'];

    // Processing statistics
    this.stats = {
      filesProcessed: 0,
      importsConverted: 0,
      filesWithChanges: 0,
      errors: [],
    };
  }

  /**
   * Start main conversion process
   */
  async convert() {
    console.log('🚀 Starting import path conversion...');
    console.log(`📁 Project directory: ${this.projectRoot}`);
    console.log(`${this.dryRun ? '🔍 Preview mode only' : '✏️  Write mode'}`);

    try {
      // Find all required files
      const files = await this.findFiles();
      console.log(`📋 Found ${files.length} files to process`);

      // Process each file
      for (const file of files) {
        await this.processFile(file);
      }

      // Print final results
      this.printSummary();
    } catch (error) {
      console.error('❌ Error in conversion process:', error.message);
      process.exit(1);
    }
  }

  /**
   * Find all files in the project
   */
  async findFiles() {
    const files = [];

    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(dir, item.name);

          if (item.isDirectory()) {
            // Skip excluded directories
            if (!this.excludeDirs.includes(item.name)) {
              scanDirectory(fullPath);
            }
          } else if (item.isFile()) {
            // Check file extension
            const ext = path.extname(item.name);
            if (this.includeExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        this.stats.errors.push(`Error reading directory ${dir}: ${error.message}`);
      }
    };

    scanDirectory(this.projectRoot);
    return files;
  }

  /**
   * Process a single file
   */
  async processFile(filePath) {
    try {
      this.stats.filesProcessed++;

      if (this.verbose) {
        console.log(`🔄 Processing: ${path.relative(this.projectRoot, filePath)}`);
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // Find and convert @app imports
      const updatedContent = this.convertImportsInContent(content, filePath);

      // Check if there are changes
      if (updatedContent !== originalContent) {
        this.stats.filesWithChanges++;

        if (!this.dryRun) {
          // Write new content
          fs.writeFileSync(filePath, updatedContent, 'utf8');
        }

        console.log(`✅ Updated: ${path.relative(this.projectRoot, filePath)}`);
      }
    } catch (error) {
      const errorMsg = `Error processing ${filePath}: ${error.message}`;
      this.stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  /**
   * Convert imports in text content
   */
  convertImportsInContent(content, currentFilePath) {
    // Basic pattern to find @app imports
    const importRegex =
      /import\s*(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*from\s*)?['"`]@app\/([^'"`]+)['"`]/g;

    let updatedContent = content;
    let match;
    let localImportsConverted = 0;

    while ((match = importRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const appPath = match[1];

      try {
        // Convert path to relative path
        const relativePath = this.convertToRelativePath(appPath, currentFilePath);

        if (relativePath) {
          const newImport = fullMatch.replace(`@app/${appPath}`, relativePath);
          updatedContent = updatedContent.replace(fullMatch, newImport);
          localImportsConverted++;
          this.stats.importsConverted++;

          if (this.verbose) {
            console.log(`  📝 ${fullMatch} → ${newImport}`);
          }
        }
      } catch (error) {
        this.stats.errors.push(
          `Error converting ${fullMatch} in ${currentFilePath}: ${error.message}`,
        );
      }
    }

    return updatedContent;
  }

  /**
   * Convert @app path to relative path
   */
  convertToRelativePath(appPath, currentFilePath) {
    // Determine absolute target path
    const targetPaths = [
      path.join(this.projectRoot, this.srcDir, appPath),
      path.join(this.projectRoot, this.libsDir, appPath),
      path.join(this.projectRoot, appPath),
    ];

    let targetPath = null;

    // Search for correct path
    for (const possiblePath of targetPaths) {
      // Check if file exists (with different extensions)
      if (this.fileExists(possiblePath)) {
        targetPath = possiblePath;
        break;
      }

      // Check if it's a directory with index file
      for (const ext of ['.ts', '.js', '.tsx', '.jsx']) {
        const indexPath = path.join(possiblePath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          targetPath = possiblePath;
          break;
        }
      }

      if (targetPath) break;
    }

    if (!targetPath) {
      console.warn(`⚠️  Could not find: @app/${appPath}`);
      return null;
    }

    // Calculate relative path
    const currentDir = path.dirname(currentFilePath);
    let relativePath = path.relative(currentDir, targetPath);

    // Convert separators to forward slashes (cross-platform compatibility)
    relativePath = relativePath.split(path.sep).join('/');

    // Add ./ if path doesn't start with . or ..
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }

    return relativePath;
  }

  /**
   * Check file existence with different extensions
   */
  fileExists(basePath) {
    // Check path as is
    if (fs.existsSync(basePath)) {
      return true;
    }

    // Check with different extensions
    for (const ext of this.includeExtensions) {
      if (fs.existsSync(basePath + ext)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Print results summary
   */
  printSummary() {
    console.log('\n📊 Results Summary:');
    console.log('=================');
    console.log(`📁 Files processed: ${this.stats.filesProcessed}`);
    console.log(`📝 Files updated: ${this.stats.filesWithChanges}`);
    console.log(`🔄 Total imports converted: ${this.stats.importsConverted}`);

    if (this.stats.errors.length > 0) {
      console.log(`❌ Errors: ${this.stats.errors.length}`);
      this.stats.errors.forEach((error) => console.log(`   • ${error}`));
    }

    if (this.dryRun) {
      console.log('\n💡 This was preview only. To apply changes, use --execute');
    } else {
      console.log('\n✅ Import paths converted successfully!');
    }
  }
}

// Command line argument processing
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    verbose: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--execute':
      case '-e':
        options.dryRun = false;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--src-dir':
        options.srcDir = args[++i];
        break;
      case '--libs-dir':
        options.libsDir = args[++i];
        break;
      case '--project-root':
        options.projectRoot = args[++i];
        break;
      default:
        if (arg.startsWith('--')) {
          console.warn(`⚠️  Unknown parameter: ${arg}`);
        }
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🔧 Import Path Converter from @app to relative paths

Usage:
  node convert-imports.js [options]

Options:
  --help, -h              Show this help
  --dry-run, -d          Preview changes only (default)
  --execute, -e          Apply changes actually
  --verbose, -v          Show more details
  --src-dir <dir>        Source directory (default: src)
  --libs-dir <dir>       Libraries directory (default: libs)  
  --project-root <dir>   Project root directory (default: current working directory)

Examples:
  node convert-imports.js --dry-run --verbose     # Preview with details
  node convert-imports.js --execute               # Apply changes
  `);
}

// Run script
async function main() {
  const options = parseArguments();

  if (options.help) {
    showHelp();
    return;
  }

  const converter = new ImportPathConverter(options);
  await converter.convert();
}

// Run script if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = ImportPathConverter;
