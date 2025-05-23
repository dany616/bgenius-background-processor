#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

import { BackgroundRemover } from './lib/background-remover.js';
import { BackgroundGenerator } from './lib/background-generator.js';
import { BackgroundProcessor } from './lib/background-processor.js';
import type { RemovalOptions, GenerationOptions } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
const pkg = JSON.parse(packageJsonContent);

program
  .name('bgenius')
  .description('AI-powered background removal and generation CLI tool')
  .version(pkg.version);

program
  .command('remove')
  .description('Remove background from an image')
  .argument('<input>', 'Input image path')
  .option('-o, --output <path>', 'Output path', 'output.png')
  .option('-m, --model <model>', 'Model to use (tensorflow|removebg)', 'tensorflow')
  .option('-k, --api-key <key>', 'API key for external services')
  .option('-p, --precision <level>', 'Precision level (low|medium|high)', 'medium')
  .action(async (input: string, options: RemovalOptions & { output: string }) => {
    const spinner = ora('Processing image...').start();
    
    try {
      const imageBuffer = await fs.readFile(input);
      const remover = new BackgroundRemover();
      
      const removalOptions: RemovalOptions = {};
      if (options.model) removalOptions.model = options.model;
      if (options.apiKey) removalOptions.apiKey = options.apiKey;
      if (options.precision) removalOptions.precision = options.precision;
      
      const result = await remover.removeBackground(imageBuffer, removalOptions);

      if (!result.success) {
        spinner.fail(chalk.red(`Failed: ${result.error ?? 'Unknown error'}`));
        process.exit(1);
      }

      if (result.data && Buffer.isBuffer(result.data)) {
        await fs.writeFile(options.output, result.data);
        spinner.succeed(chalk.green(`Background removed! Saved to ${options.output}`));
        
        if (result.metadata) {
          console.log(chalk.blue(`Processing time: ${result.metadata.processingTime}ms`));
          console.log(chalk.blue(`Model used: ${result.metadata.model}`));
        }
      } else {
        spinner.fail(chalk.red('No data received from processing'));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate new background for an image')
  .argument('<input>', 'Input image path (should have transparent background)')
  .option('-o, --output <path>', 'Output path', 'generated.png')
  .option('-p, --prompt <text>', 'Background description prompt')
  .option('-n, --negative <text>', 'Negative prompt')
  .option('-s, --style <style>', 'Generation style')
  .option('-k, --api-key <key>', 'API key for generation service')
  .action(async (input: string, options: GenerationOptions & { output: string }) => {
    const spinner = ora('Generating background...').start();
    
    try {
      let prompt = options.prompt;
      
      if (!prompt) {
        spinner.stop();
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'prompt',
            message: 'Enter background description:',
            validate: (input: string) => input.length > 0 || 'Prompt cannot be empty',
          },
        ]);
        prompt = answers.prompt;
        spinner.start('Generating background...');
      }

      const imageBuffer = await fs.readFile(input);
      const generator = new BackgroundGenerator();
      
      const generationOptions: GenerationOptions = { prompt };
      if (options.negative) generationOptions.negativePrompt = options.negative;
      if (options.style) generationOptions.style = options.style;
      if (options.apiKey) generationOptions.apiKey = options.apiKey;
      
      const result = await generator.generateBackground(imageBuffer, generationOptions);

      if (!result.success) {
        spinner.fail(chalk.red(`Failed: ${result.error ?? 'Unknown error'}`));
        process.exit(1);
      }

      if (result.data && Buffer.isBuffer(result.data)) {
        await fs.writeFile(options.output, result.data);
        spinner.succeed(chalk.green(`Background generated! Saved to ${options.output}`));
        
        if (result.metadata) {
          console.log(chalk.blue(`Processing time: ${result.metadata.processingTime}ms`));
        }
      } else {
        spinner.fail(chalk.red('No data received from processing'));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program
  .command('process')
  .description('Remove background and generate new one in a single step')
  .argument('<input>', 'Input image path')
  .option('-o, --output <path>', 'Output path', 'processed.png')
  .option('-p, --prompt <text>', 'Background description prompt')
  .option('-m, --model <model>', 'Background removal model (tensorflow|removebg)', 'tensorflow')
  .option('-k, --api-key <key>', 'API key for external services')
  .action(async (input: string, options: any) => {
    const spinner = ora('Processing image...').start();
    
    try {
      let prompt = options.prompt;
      
      if (!prompt) {
        spinner.stop();
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'prompt',
            message: 'Enter background description:',
            validate: (input: string) => input.length > 0 || 'Prompt cannot be empty',
          },
        ]);
        prompt = answers.prompt;
        spinner.start('Processing image...');
      }

      const imageBuffer = await fs.readFile(input);
      const processor = new BackgroundProcessor();
      
      const result = await processor.processImage(imageBuffer, {
        prompt,
        removalModel: options.model,
        apiKey: options.apiKey,
      });

      if (!result.success) {
        spinner.fail(chalk.red(`Failed: ${result.error ?? 'Unknown error'}`));
        process.exit(1);
      }

      if (result.data && Buffer.isBuffer(result.data)) {
        await fs.writeFile(options.output, result.data);
        spinner.succeed(chalk.green(`Image processed! Saved to ${options.output}`));
        
        if (result.metadata) {
          console.log(chalk.blue(`Processing time: ${result.metadata.processingTime}ms`));
        }
      } else {
        spinner.fail(chalk.red('No data received from processing'));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program
  .command('interactive')
  .description('Interactive mode for background processing')
  .action(async () => {
    console.log(chalk.blue.bold('\n🎨 BGeniUS Interactive Mode\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Remove background only', value: 'remove' },
          { name: 'Generate background only', value: 'generate' },
          { name: 'Remove and generate (full process)', value: 'process' },
        ],
      },
      {
        type: 'input',
        name: 'input',
        message: 'Enter input image path:',
        validate: async (input: string) => {
          try {
            await fs.access(input);
            return true;
          } catch {
            return 'File does not exist';
          }
        },
      },
      {
        type: 'input',
        name: 'output',
        message: 'Enter output path:',
        default: 'output.png',
      },
    ]);

    if (answers.action === 'generate' || answers.action === 'process') {
      const promptAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'prompt',
          message: 'Enter background description:',
          validate: (input: string) => input.length > 0 || 'Prompt cannot be empty',
        },
      ]);
      answers.prompt = promptAnswer.prompt;
    }

    // Execute the chosen action
    const command = program.commands.find(cmd => cmd.name() === answers.action);
    if (command) {
      const args = [
        process.argv[0],
        process.argv[1],
        answers.action,
        answers.input,
        '-o', answers.output,
        ...(answers.prompt ? ['-p', answers.prompt] : []),
      ];
      await command.parseAsync(args);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('See --help for a list of available commands.'));
  process.exit(1);
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(); 