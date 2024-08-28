import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NgModule } from '@angular/core';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import {BarComponent} from './bar/bar.component';
import {ScatterComponent} from './scatter/scatter.component';


export const appConfig: ApplicationConfig = {

  providers: [provideRouter(routes), provideClientHydration()]

};
