/* Every page about one restaurant, by its address key. Used by the khabo team's restaurant pages
   (/admin/r/<id>/<key>, one folder per key under app/[lang]/admin/r/[rid]/); owners reach the same components through /partner/<key>. */
import type { ComponentType } from 'react';
import { Overview } from './overview';
import { MenuPage } from './menu';
import { Profile } from './profile';
import { SitePage } from './site';
import { Photos } from './photos';
import { Deals } from './deals';
import { Events } from './events';
import { Reviews } from './reviews';
import { TableQr } from './qr';
import { PrintMenu } from './print';
import { Insights } from './insights';
import { Team } from './team';
import { AdminSettings } from './settings';

export const REST_VIEWS: Record<string, ComponentType> = {
  '': Overview,
  'menu': MenuPage,
  'profile': Profile,
  'site': SitePage,
  'photos': Photos,
  'deals': Deals,
  'events': Events,
  'reviews': Reviews,
  'qr': TableQr,
  'print': PrintMenu,
  'insights': Insights,
  'team': Team,
  settings: AdminSettings,
};
