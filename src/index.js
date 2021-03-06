#! /usr/bin/env node

import inquirer from 'inquirer';
import path from 'path';
import isValid from 'is-valid-path';
import mkdir from 'mkdirp-promise';
import {success as successIcon, error as errorIcon} from 'log-symbols';

import readAndWriteFiles, {pkg} from './file-operations';

const templateNameRegex = /\w+/;
const promptConfig = [
  {
    type: 'input',
    name: 'templateName',
    message: 'What is your bridge module called?',
    default: 'ExampleBridge',
    validate: input => templateNameRegex.test(input),
  },
  {
    type: 'checkbox',
    name: 'environment',
    message: 'What OS & languages would you like to support?',
    default: ['Android/Java', 'iOS/Swift', 'iOS/Objective-C'],
    choices: ['Android/Java', 'iOS/Swift', 'iOS/Objective-C'],
  },
  {
    type: 'input',
    name: 'jsPath',
    message: 'What directory should we deliver your JS files to?',
    default: '.',
    validate: input => isValid(input),
  },
];

const environmentMap = {
  'Android/Java': createAndroidEnvironment,
  'iOS/Swift': createSwiftEnvironment,
  'iOS/Objective-C': createObjCEnvironment,
};

async function init() {
  try {
    const answers = await inquirer.prompt(promptConfig);

    const promises = answers.environment.map(async env =>
      environmentMap[env](answers.templateName));

    promises.push(createJSEnvironment(answers.templateName, answers.jsPath));
    await Promise.all(promises);

    console.log(
      `${successIcon} Your bridge module was successfully created! 🎉`,
    );
  } catch (e) {
    console.log(
      `${errorIcon} Oh no! 💩  Something went wrong with creating your bridge module.\nPlease report any errors here: https://github.com/peggyrayzis/react-native-create-bridge/issues\n\nError: ${e}`,
    );
  }
}

async function createAndroidEnvironment(templateName) {
  const appPath = path.join(
    process.cwd(),
    'android',
    'app',
    'src',
    'main',
    'java',
    'com',
    pkg.name,
  );
  const writeDirPath = await mkdir(
    path.join(appPath, templateName.toLowerCase()),
  );
  const paths = {
    readDirPath: path.join(__dirname, '..', 'templates', 'android'),
    writeDirPath,
  };
  const files = [
    'TemplatePackage.java',
    'TemplateModule.java',
    'TemplateManager.java',
  ];
  return readAndWriteFiles(
    files,
    paths,
    templateName,
    templateName.toLowerCase(),
    pkg.name.toLowerCase(),
  );
}

function createSwiftEnvironment(templateName) {
  const paths = {
    readDirPath: path.join(__dirname, '..', 'templates', 'ios-swift'),
    writeDirPath: path.join(process.cwd(), 'ios'),
  };
  const files = ['Template.m', 'TemplateManager.swift'];
  return readAndWriteFiles(files, paths, templateName);
}

function createObjCEnvironment(templateName) {
  const paths = {
    readDirPath: path.join(__dirname, '..', 'templates', 'ios-objc'),
    writeDirPath: path.join(process.cwd(), 'ios'),
  };
  const files = ['Template.h', 'TemplateManager.m'];
  return readAndWriteFiles(files, paths, templateName);
}

async function createJSEnvironment(templateName, jsPath) {
  await mkdir(jsPath);

  const paths = {
    readDirPath: path.join(__dirname, '..', 'templates', 'js'),
    writeDirPath: jsPath,
  };
  const files = ['TemplateNativeModule.js', 'TemplateNativeView.js'];
  return readAndWriteFiles(files, paths, templateName);
}

init();
