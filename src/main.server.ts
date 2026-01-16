import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { appConfig } from './app/app.config';
import { serverConfig } from './app/app.config.server';

export const config = mergeApplicationConfig(appConfig, serverConfig);

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(App, config, context);

export default bootstrap;

