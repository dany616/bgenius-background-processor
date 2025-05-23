#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';

const pkg = {
  version: '1.0.0',
};

program
  .name('bgenius-test')
  .description(
    '🎨 AI-powered background removal and generation CLI tool (Test Version)'
  )
  .version(pkg.version);

program
  .command('test')
  .description('Test basic CLI functionality')
  .action(() => {
    console.log(chalk.green('✅ CLI tool is working!'));
    console.log(chalk.blue('🎨 BGeniUS Background Processor v' + pkg.version));
    console.log(
      chalk.yellow('📦 This is a test version to verify CLI functionality')
    );
  });

program
  .command('help-demo')
  .description('Show available commands demo')
  .action(() => {
    console.log(chalk.blue.bold('\n🎨 BGeniUS Background Processor\n'));
    console.log(chalk.green('Available Commands:'));
    console.log(chalk.white('  remove      Remove background from an image'));
    console.log(
      chalk.white('  generate    Generate new background for an image')
    );
    console.log(
      chalk.white('  interactive Interactive mode for background processing')
    );
    console.log(chalk.white('  test        Test basic CLI functionality'));
    console.log(chalk.white('  help-demo   Show this help demo'));

    console.log(chalk.green('\nExample Usage:'));
    console.log(chalk.gray('  bgenius remove input.jpg -o output.png'));
    console.log(
      chalk.gray(
        '  bgenius generate input.png -p "sunset beach scene" -o result.png'
      )
    );
    console.log(chalk.gray('  bgenius interactive'));
  });

program
  .command('validate-file')
  .description('Validate if a file exists and is readable')
  .argument('<file>', 'File path to validate')
  .action(async file => {
    try {
      await fs.access(file);
      const stats = await fs.stat(file);
      console.log(chalk.green(`✅ File exists: ${file}`));
      console.log(chalk.blue(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`));
      console.log(chalk.blue(`📅 Modified: ${stats.mtime.toLocaleString()}`));
    } catch (error) {
      console.log(chalk.red(`❌ File not found: ${file}`));
      console.log(
        chalk.yellow('Make sure the file path is correct and the file exists.')
      );
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`❌ Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('💡 Run --help to see available commands.'));
  process.exit(1);
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.blue.bold('🎨 BGeniUS Background Processor CLI Tool'));
  console.log(chalk.yellow('Run with --help to see available commands'));
  program.outputHelp();
}

program.parse();
