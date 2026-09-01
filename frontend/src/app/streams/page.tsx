'use client';

import React, { useState } from 'react';
import {
  Tv,
  Radio,
  Maximize2,
  Minimize2,
  ExternalLink,
  Volume2,
  ShieldCheck,
  Zap,
  Sparkles,
  Signal,
  Search,
  Filter,
  SlidersHorizontal,
  Play,
  RotateCcw,
  CheckCircle2,
  Eye,
  Layers,
  Flame,
} from 'lucide-react';
import { FaviconSearch } from '@/components/ui/FaviconSearch';

interface Channel {
  id: string;
  name: string;
  category: 'Premier League' | 'LaLiga';
  quality: string;
  fps: number;
  language: string;
  bitrate: string;
  isLive: boolean;
  embedUrl: string;
  description: string;
  server: string;
}

const CHANNELS: Channel[] = [
  // ──────────────────────────────────────────────
  // PREMIER LEAGUE BROADCAST CHANNELS
  // ──────────────────────────────────────────────
  {
    id: 'pl-tv-hd-1',
    name: 'Premier League TV HD (Channel 1)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,400 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=WElXbjZyTXRVZ3RDRDYyQjhiZjAwaVFIcjN2SFF6ZHBBdUlMdEJ6VXIrNWlnSHFjWThic2ZubG1RdzY5NmNDOQ~~',
    description: 'Premier League official high-definition primary television broadcast feed.',
    server: 'London Node (Edge 01)',
  },
  {
    id: 'pl-tv-hd-2',
    name: 'Premier League TV HD (Channel 2)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,200 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=Z0hobzNYTEYyVE4xRHNDRDNBSlFzbEdRM29PSXN3Vkw0UXROczFlMkh5OFZ0bzQrcGVPbVhGaEIrMjZDM0VMR3krcE42dkVZNjhQRnRDdlZUOWZVT28yVWp1VXFpdTUwRHNWeS9ubUlEN21xWjVxZWFnZGpmWTlwOFZLaGtEMmI~',
    description: 'Premier League secondary high-definition live television broadcast.',
    server: 'London Node (Edge 02)',
  },
  {
    id: 'sky-sports-pl-1',
    name: 'Sky Sports Premier League (Channel 3)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,500 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=WElXbjZyTXRVZ3RDRDYyQjhiZjAwaWRhQ2NLU3FpY2pta3o5Q1Z4RkRYS1drbWhyK0hBSmh3MzdkZ25UQVZzMw~~',
    description: 'Sky Sports Premier League dedicated live studio broadcast transmission.',
    server: 'UK Direct 01',
  },
  {
    id: 'sky-sports-me-2',
    name: 'Sky Sports Main Event (Channel 4)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,400 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=WElXbjZyTXRVZ3RDRDYyQjhiZjAwb1VhMGQ2a1V5dS9KUWZYdGp6Y1NwWDduNGV5Y042eVVJZmFZMDk3WTA0Tw~~',
    description: 'Sky Sports Main Event high-bitrate live television feed.',
    server: 'UK Direct 02',
  },
  {
    id: 'tnt-sports-1',
    name: 'TNT Sports 1 HD (Channel 5)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,300 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=RkVvdmRiYVdSSzVTc3N6TjlZOUYwVE83SFN5aklaeC9hUjhpcHlxTjQ2c3B2dmorN0JTM3E1ekNyeFYycjZZK3N5ZVZjOE9YM1ZianM0SmZwWVVlOEE9PQ~~',
    description: 'TNT Sports 1 premier live football broadcast feed.',
    server: 'Stratford Hub 01',
  },
  {
    id: 'tnt-sports-2',
    name: 'TNT Sports 2 HD (Channel 6)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,100 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=WElXbjZyTXRVZ3RDRDYyQjhiZjAwdGtJZWdFVHhmNEJNNitzcUNnNGJQSHlXUW1wN2R0LzlndVFyYVJtRDFZNQ~~',
    description: 'TNT Sports 2 live alternate sports broadcast transmission.',
    server: 'Stratford Hub 02',
  },
  {
    id: 'nbc-sports-pl',
    name: 'NBC Sports Premier League (Channel 7)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English (US)',
    bitrate: '6,200 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=WElXbjZyTXRVZ3RDRDYyQjhiZjAwcDJTeE9CRUNReERtUXJubldtQkE0ZU1lUFYzZ1VmcjVqUENqOGZuL2VWMA~~',
    description: 'NBC Sports US domestic live coverage feed.',
    server: 'New York Relay',
  },
  {
    id: 'usa-network-pl',
    name: 'USA Network Premier HD (Channel 8)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English (US)',
    bitrate: '6,000 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=Z0hobzNYTEYyVE4xRHNDRDNBSlFzbEdRM29PSXN3Vkw0UXROczFlMkh5OFZ0bzQrcGVPbVhGaEIrMjZDM0VMR2xEMGRQRFRob3Z0WWZXa2pOeG1nYzN0SUJTRUY2OXJMSG44cVNuTVlnVktwWUVLVEpZV1ovbDR5L3RIVHFNTjNyZXhkRGVmanRkd29uNUIzcG5BVkdRPT0~',
    description: 'USA Network national sports broadcast stream transmission.',
    server: 'Chicago Relay',
  },
  {
    id: 'peacock-premier-live',
    name: 'Peacock Premier Live (Channel 9)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,100 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=WElXbjZyTXRVZ3RDRDYyQjhiZjAwaWVFZk9DZEdtUEw0V25rSXFvNU9rejBqZHloTXNscjRrUVpHVGphQ1h3aA~~',
    description: 'Peacock premium digital live football broadcast stream.',
    server: 'US Anycast Edge',
  },
  {
    id: 'optus-sport-1',
    name: 'Optus Sport 1 HD (Channel 10)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,300 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=RkVvdmRiYVdSSzVTc3N6TjlZOUYwVE83SFN5aklaeC9hUjhpcHlxTjQ2dStrTDNlNmphK0VlN2FnUXdXajN6emw4eTIyOGd6WFFBaFp1MnlFZjZad0E9PQ~~',
    description: 'Optus Sport Oceania live television broadcast transmission.',
    server: 'Sydney Node',
  },
  {
    id: 'optus-sport-2',
    name: 'Optus Sport 2 HD (Channel 11)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,000 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=WElXbjZyTXRVZ3RDRDYyQjhiZjAwaEk3N3owa21wdnlrbHdkVXpDMEdGVDBWNnF0ZVBDR1BGWE5rdk1may9DSw~~',
    description: 'Optus Sport multi-feed secondary live transmission.',
    server: 'Melbourne Node',
  },
  {
    id: 'astro-supersport-pl',
    name: 'Astro SuperSport PL (Channel 12)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '5,900 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=WElXbjZyTXRVZ3RDRDYyQjhiZjAwZ1RSSmhBTUl0SEtWYWg2azJMalFXQlZ1aEdJMGJ6M0paOERhSG1TMlZueA~~',
    description: 'Astro SuperSport dedicated Asian broadcast live feed.',
    server: 'Singapore Edge',
  },
  {
    id: 'star-sports-select',
    name: 'Star Sports Select HD (Channel 13)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,200 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=Z0hobzNYTEYyVE4xRHNDRDNBSlFzbEdRM29PSXN3Vkw0UXROczFlMkh5OFZ0bzQrcGVPbVhGaEIrMjZDM0VMR1ppWTQ1dUVHaGp5b0VzZ0lXWlJ0cUcrcWM5NG80UFNBTGU1Q3YwSzk2MWJGaklMdmVJKzJDaldlK3Z6OTlsQlZuSXJQSEJGUENNUmhqcUw3U1RwK1hnPT0~',
    description: 'Star Sports Select high-definition studio live stream.',
    server: 'Mumbai Hub',
  },
  {
    id: 'canal-plus-pl',
    name: 'Canal+ Premier League (Channel 14)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'French / English',
    bitrate: '6,400 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=Z0hobzNYTEYyVE4xRHNDRDNBSlFzbEdRM29PSXN3Vkw0UXROczFlMkh5OFZ0bzQrcGVPbVhGaEIrMjZDM0VMR2xEMGRQRFRob3Z0WWZXa2pOeG1nYzRQVDVHL2Zva3VqcjZUVEZzT09VNE16ODhKK3VGTW8xN1IrWXI4S2RQbjZ1QVMybGlhZ1NaWFh4UGtZeEQrT1ZVeXk3bFNzRC9SdEVPYk5xNEZCNkk4PQ~~',
    description: 'Canal+ European football live television broadcast.',
    server: 'Paris Node 01',
  },
  {
    id: 'dazn-premier-hd',
    name: 'DAZN Premier League (Channel 15)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English / Multi',
    bitrate: '6,300 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=RkVvdmRiYVdSSzVTc3N6TjlZOUYwVE83SFN5aklaeC9hUjhpcHlxTjQ2dGJHOXdYVXhja0puNHRhTzdwTkVQeTRiOUd3NXAzcVJYTXhCVkZ1dy9kM1E9PQ~~',
    description: 'DAZN digital live sports television stream transmission.',
    server: 'Frankfurt Direct',
  },
  {
    id: 'supersport-pl-live',
    name: 'SuperSport Premier League (Channel 16)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,000 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=Z0hobzNYTEYyVE4xRHNDRDNBSlFzbEdRM29PSXN3Vkw0UXROczFlMkh5OFZ0bzQrcGVPbVhGaEIrMjZDM0VMR0U3OWdOUTNtZ2NONHN4R1BNaGwyQXpWOWoxZTlkVVhmWnRMZlJIa0M0S2NkamdaTC94bnh1dnhGMUVhQTVRMTJFUmg3enNMUVZMbndHWXZsbjVEMlp5KzB6ZDhJb1hsMFFwOHc5ZDdmWXhzPQ~~',
    description: 'SuperSport international live television broadcast stream.',
    server: 'London Node',
  },
  {
    id: 'bein-sports-en-1',
    name: 'BeIN Sports English 1 (Channel 17)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,300 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=RkVvdmRiYVdSSzVTc3N6TjlZOUYwVE83SFN5aklaeC9hUjhpcHlxTjQ2dUVpQllKMEtrQmgzbG5DaWt2VjZnTGNNalljbFE5dEJkRHA2dnNLY096cGc9PQ~~',
    description: 'BeIN Sports English high-definition live football stream.',
    server: 'Doha Central',
  },
  {
    id: 'bein-sports-en-2',
    name: 'BeIN Sports English 2 (Channel 18)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,100 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=RkVvdmRiYVdSSzVTc3N6TjlZOUYwVE83SFN5aklaeC9hUjhpcHlxTjQ2dEtHK2I3QVFLcGdXSnNuZEU0UWRUbWNHYmVSUWNrTHFFbFNBR2ttVGJXNFE9PQ~~',
    description: 'BeIN Sports English 2 multi-match alternate live feed.',
    server: 'Doha Edge 02',
  },
  {
    id: 'premier-sports-uk-1',
    name: 'Premier Sports UK 1 (Channel 19)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,000 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=RkVvdmRiYVdSSzVTc3N6TjlZOUYwVE83SFN5aklaeC9hUjhpcHlxTjQ2dGt6MFQ1QzJXY2ZaeEZRbWJvSDIzWFJuZUFtaStBc2psQlFpcnVIaWtkcUE9PQ~~',
    description: 'Premier Sports UK high-definition live television broadcast.',
    server: 'Dublin Edge',
  },
  {
    id: 'fubo-sports-pl',
    name: 'Fubo Sports Premier (Channel 20)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,200 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=ZWNCRURUQ1pVMnJreTY3ODNiQi9mRVgyKzdheGxEQ1V2ckswak5EREE4NmlxTlJzY0ZSSVF1SFdST2lRTlZQYw~~',
    description: 'Fubo Sports digital live television stream feed.',
    server: 'US Central Relay',
  },
  {
    id: 'viaplay-pl-hd',
    name: 'Viaplay Premier League (Channel 21)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'English / Scandinavian',
    bitrate: '6,300 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=ZWNCRURUQ1pVMnJreTY3ODNiQi9mRVgyKzdheGxEQ1V2ckswak5EREE4N3JvY2dVVVhieENucWl3K1VqTFRTNw~~',
    description: 'Viaplay Nordic live sports television transmission.',
    server: 'Stockholm Hub',
  },
  {
    id: 'pl-ultra-direct',
    name: 'Premier League Ultra Feed 1 (Channel 22)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'Ambient / English',
    bitrate: '6,500 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=ZWNCRURUQ1pVMnJreTY3ODNiQi9mRVgyKzdheGxEQ1V2ckswak5EREE4NC9QQ2UrWEE4bWFCdU5YTU9qRHlqYw~~',
    description: 'Premier League high-bitrate stadium direct broadcast feed.',
    server: 'Global Anycast 01',
  },
  {
    id: 'pl-ultra-multicam',
    name: 'Premier League Ultra Feed 2 (Channel 23)',
    category: 'Premier League',
    quality: '1080p HD',
    fps: 60,
    language: 'Ambient / English',
    bitrate: '6,500 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=ZWNCRURUQ1pVMnJreTY3ODNiQi9mRVgyKzdheGxEQ1V2ckswak5EREE4NjZFWS9pWnVaRytTYnFGZUR0MmtESQ~~',
    description: 'Premier League high-bitrate multi-cam live broadcast transmission.',
    server: 'Global Anycast 02',
  },

  // ──────────────────────────────────────────────
  // LA LIGA BROADCAST CHANNELS
  // ──────────────────────────────────────────────
  {
    id: 'laliga-tv-hd-1',
    name: 'LaLiga TV HD (Channel 1)',
    category: 'LaLiga',
    quality: '1080p HD',
    fps: 60,
    language: 'Spanish / English',
    bitrate: '6,400 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=Z0hobzNYTEYyVE4xRHNDRDNBSlFzbEdRM29PSXN3Vkw0UXROczFlMkh5OFZ0bzQrcGVPbVhGaEIrMjZDM0VMR1REMkFOU3FMYzJrbTBPMU5CZzZNY3RuZG8vRWNObERDSFZoR1pYbTdHZkc3Y1d3TE1mNWdWZVlJRk02ZHVHY29ZcEdOeWphdmtrMXpFdld0WGhFZy93PT0~',
    description: 'LaLiga primary official broadcast feed with high-bitrate multi-language audio track.',
    server: 'Direct CDN (Edge 01)',
  },
  {
    id: 'laliga-tv-hd-2',
    name: 'LaLiga TV HD (Channel 2)',
    category: 'LaLiga',
    quality: '1080p HD',
    fps: 60,
    language: 'Spanish',
    bitrate: '6,200 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=Z0hobzNYTEYyVE4xRHNDRDNBSlFzbEdRM29PSXN3Vkw0UXROczFlMkh5OFZ0bzQrcGVPbVhGaEIrMjZDM0VMR29CTHZ0WHIrbUZhMXFUc2hnN0V0SDJQalQ2cWlxNkRvTWlYR1p5dGdmL2V5ODIybjl3OFFYWWpzMXVZY1JlSGwyYXUvMWRqOEdQSnVNZitQTk83OENnPT0~',
    description: 'LaLiga secondary live television broadcast transmission.',
    server: 'Direct CDN (Edge 02)',
  },
  {
    id: 'laliga-movistar-hd',
    name: 'LaLiga Movistar HD (Channel 3)',
    category: 'LaLiga',
    quality: '1080p HD',
    fps: 60,
    language: 'Spanish (Castellano)',
    bitrate: '6,500 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=WElXbjZyTXRVZ3RDRDYyQjhiZjAwcjlqZi93eUpxUDhQYWJpa1B5OVYxME9vdndiRTlCRFlxVFQyR1Z2K1k5dw~~',
    description: 'LaLiga Spanish domestic sports broadcast network live feed.',
    server: 'Madrid Relay 01',
  },
  {
    id: 'laliga-dazn-hd',
    name: 'LaLiga DAZN HD (Channel 4)',
    category: 'LaLiga',
    quality: '1080p HD',
    fps: 60,
    language: 'Spanish / Ambient',
    bitrate: '6,100 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=RkVvdmRiYVdSSzVTc3N6TjlZOUYwVE83SFN5aklaeC9hUjhpcHlxTjQ2c214WWlTSzZ6S3FvOEpub0p4dzFYeWZNRktMbFpPMWVXTUoxNWoxdlhQRlE9PQ~~',
    description: 'LaLiga digital live sports broadcast feed with stadium acoustic audio.',
    server: 'Frankfurt Direct',
  },
  {
    id: 'laliga-supersport-hd',
    name: 'LaLiga SuperSport HD (Channel 5)',
    category: 'LaLiga',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '5,800 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=Z0hobzNYTEYyVE4xRHNDRDNBSlFzbEdRM29PSXN3Vkw0UXROczFlMkh5OFZ0bzQrcGVPbVhGaEIrMjZDM0VMR0ZaQnplaTd6WlQvbzJnNUtBYzBwODdnUTZPRlNWRnlPZGVQUS9YZUFFMGJ2WDRVUkNvNGJZMURQcmMvUllHVUQ~',
    description: 'LaLiga international broadcast feed with English studio commentary.',
    server: 'London Node',
  },
  {
    id: 'laliga-bein-hd',
    name: 'LaLiga BeIN Sports HD (Channel 6)',
    category: 'LaLiga',
    quality: '1080p HD',
    fps: 60,
    language: 'Spanish / French / English',
    bitrate: '6,300 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=ZWNCRURUQ1pVMnJreTY3ODNiQi9mRVgyKzdheGxEQ1V2ckswak5EREE4NkJROW1RRXA2NE9XZldOYjJhZkV2SA~~',
    description: 'LaLiga international multi-language broadcast transmission feed.',
    server: 'Paris Central',
  },
  {
    id: 'laliga-premier-hd',
    name: 'LaLiga Premier Sports HD (Channel 7)',
    category: 'LaLiga',
    quality: '1080p HD',
    fps: 60,
    language: 'English',
    bitrate: '6,000 kbps',
    isLive: true,
    embedUrl:
      'https://ntv.cx/embed?t=WElXbjZyTXRVZ3RDRDYyQjhiZjAwaCsrWWgzM25YYmhQWDlDYlJxeWtGT0pkUDRWbFZaNmRteVlGRUdrcVVySA~~',
    description: 'LaLiga European sports network live transmission feed.',
    server: 'Dublin Edge',
  },
];

export default function LiveStreamsPage() {
  const [selectedChannel, setSelectedChannel] = useState<Channel>(CHANNELS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cinemaMode, setCinemaMode] = useState<boolean>(false);
  const [playerKey, setPlayerKey] = useState<number>(0);

  const categories = ['all', 'Premier League', 'LaLiga'];

  const filteredChannels = CHANNELS.filter((ch) => {
    const matchesCategory = categoryFilter === 'all' || ch.category === categoryFilter;
    const matchesSearch =
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.quality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const reloadPlayer = () => {
    setPlayerKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="mono-font flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              LIVE BROADCAST CHANNELS
            </span>
            <span className="text-xs text-slate-400 font-mono">1080p 60FPS HD</span>
          </div>
          <h1 className="display-font text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Live Stream TV Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Select a live broadcast channel below to stream official live coverage in high-definition ultra-low latency video.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Signal size={14} className="animate-pulse text-emerald-400" />
            <span>{CHANNELS.length} Channels Online</span>
          </div>

          <a
            href={selectedChannel.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-300 transition"
          >
            <span>Popout Player</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Main Video Theater Section */}
      <div className={`space-y-4 ${cinemaMode ? 'max-w-7xl mx-auto' : ''}`}>
        <div className="overflow-hidden rounded-2xl border border-rose-500/40 bg-[#0c1018] shadow-[0_0_50px_rgba(244,63,94,0.15)]">
          {/* Player Header Bar */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-black/60 px-5 py-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                <Tv size={18} className="animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="mono-font rounded border border-rose-500/40 bg-rose-500/25 px-2 py-0.5 text-[9px] font-bold text-rose-300 uppercase tracking-widest flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                    LIVE ON AIR
                  </span>
                  <span className="mono-font text-[11px] font-semibold text-cyan-400">
                    {selectedChannel.quality}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    {selectedChannel.fps} FPS • {selectedChannel.bitrate}
                  </span>
                </div>
                <h2 className="display-font text-base sm:text-lg font-bold text-white tracking-tight">
                  {selectedChannel.name}
                </h2>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={reloadPlayer}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white transition"
                title="Reload Live Feed"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reload Feed</span>
              </button>

              <button
                onClick={() => setCinemaMode(!cinemaMode)}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white transition"
                title="Toggle Cinema Mode"
              >
                {cinemaMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span className="hidden sm:inline">{cinemaMode ? 'Standard' : 'Cinema'}</span>
              </button>
            </div>
          </div>

          {/* Iframe Video Frame */}
          <div className="relative aspect-video w-full bg-black">
            <iframe
              key={playerKey}
              src={selectedChannel.embedUrl}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>

          {/* Player Footer Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/[0.08] bg-black/70 px-5 py-3.5 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                <ShieldCheck size={14} />
                <span>Verified Stream Feed</span>
              </span>

              <span className="text-slate-400">
                Language: <strong className="text-slate-200">{selectedChannel.language}</strong>
              </span>

              <span className="text-slate-400">
                Server: <strong className="text-slate-200">{selectedChannel.server}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1 text-rose-400 font-mono">
                <Signal size={12} className="animate-pulse" /> Edge Latency: 1.2s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Switcher & Guide Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="display-font text-xl font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-cyan-400" />
              <span>Channel Directory & Guide</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Switch between available sports television channels and ultra high-definition feeds.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-80">
            <FaviconSearch
              placeholder="Search channels, quality, audio..."
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              clearable={true}
              className="w-full"
              inputClassName="py-2 pl-[46px] text-xs rounded-xl bg-[#0e1320] border-white/10"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 flex-wrap border-b border-white/[0.06] pb-3">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1 font-mono">
            <Filter size={12} /> Filter:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                categoryFilter === cat
                  ? 'border border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'border border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Channels' : cat}
            </button>
          ))}
        </div>

        {/* Channels Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredChannels.map((channel) => {
            const isSelected = selectedChannel.id === channel.id;

            return (
              <div
                key={channel.id}
                onClick={() => {
                  setSelectedChannel(channel);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`cursor-pointer rounded-2xl p-4 transition duration-200 relative overflow-hidden group ${
                  isSelected
                    ? 'border-2 border-rose-500 bg-gradient-to-b from-rose-950/40 via-[#111624] to-[#0c1018] shadow-[0_0_25px_rgba(244,63,94,0.25)]'
                    : 'border border-white/10 bg-[#0e1320] hover:border-white/20 hover:bg-[#121829]'
                }`}
              >
                {/* Active Indicator Pin */}
                {isSelected && (
                  <div className="absolute top-0 right-0 rounded-bl-xl bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider mono-font shadow">
                    Active
                  </div>
                )}

                {/* Top Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                        isSelected
                          ? 'border-rose-500/50 bg-rose-500/25 text-rose-300'
                          : 'border-white/10 bg-white/5 text-slate-400 group-hover:text-cyan-400'
                      }`}
                    >
                      <Tv size={15} />
                    </div>
                    <div>
                      <span className="mono-font text-[9px] uppercase tracking-wider text-slate-400 block">
                        {channel.category}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {channel.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                  {channel.description}
                </p>

                {/* Badges */}
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-[10px] font-mono">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-cyan-300 border border-white/5">
                    {channel.quality}
                  </span>

                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Action button hover */}
                <div className="mt-3">
                  <button
                    className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                        : 'bg-white/5 text-slate-300 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 group-hover:border group-hover:border-cyan-500/30'
                    }`}
                  >
                    <Play size={11} fill="currentColor" />
                    <span>{isSelected ? 'Now Playing' : 'Switch Channel'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
