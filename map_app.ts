
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Loader} from '@googlemaps/js-api-loader';
import hljs from 'highlight.js';
import {html, LitElement, PropertyValueMap} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {Marked} from 'marked';
import {markedHighlight} from 'marked-highlight';

import {MapParams} from './mcp_maps_server';

/** Markdown formatting function with syntax highlighting */
export const marked = new Marked(
  markedHighlight({
    async: true,
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, {language}).value;
    },
  }),
);

const ICON_BUSY = html`<svg
  class="rotating"
  xmlns="http://www.w3.org/2000/svg"
  height="16px"
  viewBox="0 -960 960 960"
  width="16px"
  fill="currentColor">
  <path
    d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z" />
</svg>`;

export enum ChatState {
  IDLE,
  GENERATING,
  THINKING,
  EXECUTING,
}

enum ChatTab {
  GEMINI,
}

const USER_PROVIDED_GOOGLE_MAPS_API_KEY: string =
  'AIzaSyAJPTwj4S8isr4b-3NtqVSxk450IAS1lOQ';

const EXAMPLE_PROMPTS = [
  "Show me directions from Tokyo Tower to Shibuya Crossing.",
  "Can you show me a beautiful beach?",
  "Show me San Francisco",
  "Where is a place with a tilted tower?",
  "Take me to the northernmost capital city in the world",
  "How about the southernmost permanently inhabited settlement?",
  "Let's jump to Machu Picchu in Peru",
];

@customElement('gdm-map-app')
export class MapApp extends LitElement {
  @query('#anchor') anchor?: HTMLDivElement;
  @query('#mapContainer') mapContainerElement?: HTMLElement;
  @query('#messageInput') messageInputElement?: HTMLInputElement;

  @state() chatState = ChatState.IDLE;
  @state() selectedChatTab = ChatTab.GEMINI;
  @state() inputMessage = '';
  @state() messages: HTMLElement[] = [];
  @state() mapInitialized = false;
  @state() mapError = '';

  private map?: any;
  private geocoder?: any;
  private marker?: any;
  private Map3DElement?: any;
  private Marker3DElement?: any;
  private Polyline3DElement?: any;
  private directionsService?: any;
  private routePolyline?: any;
  private originMarker?: any;
  private destinationMarker?: any;

  sendMessageHandler?: CallableFunction;

  constructor() {
    super();
    this.setNewRandomPrompt();
  }

  createRenderRoot() {
    return this;
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    this.loadMap();
  }

  private setNewRandomPrompt() {
    if (EXAMPLE_PROMPTS.length > 0) {
      this.inputMessage =
        EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    }
  }

  async loadMap() {
    const isApiKeyPlaceholder =
      USER_PROVIDED_GOOGLE_MAPS_API_KEY === '' ||
      USER_PROVIDED_GOOGLE_MAPS_API_KEY.includes('REPLACE');

    if (isApiKeyPlaceholder) {
      this.mapError = `API Key missing. Please set USER_PROVIDED_GOOGLE_MAPS_API_KEY in map_app.ts.`;
      // Fix: Cast to any to access requestUpdate when compiler cannot resolve inherited method
      (this as any).requestUpdate();
      return;
    }

    const loader = new Loader({
      apiKey: USER_PROVIDED_GOOGLE_MAPS_API_KEY,
      version: 'beta',
      libraries: ['geocoding', 'routes', 'geometry'],
    });

    try {
      await loader.load();
      const maps3dLibrary = await (window as any).google.maps.importLibrary('maps3d');
      this.Map3DElement = maps3dLibrary.Map3DElement;
      this.Marker3DElement = maps3dLibrary.Marker3DElement;
      this.Polyline3DElement = maps3dLibrary.Polyline3DElement;
      this.directionsService = new (window as any).google.maps.DirectionsService();
      this.initializeMap();
      this.mapInitialized = true;
    } catch (error) {
      console.error('Map Load Error:', error);
      this.mapError = 'Could not load Google Maps.';
    }
    // Fix: Cast to any to access requestUpdate when compiler cannot resolve inherited method
    (this as any).requestUpdate();
  }

  initializeMap() {
    if (!this.mapContainerElement || !this.Map3DElement) return;
    this.map = this.mapContainerElement;
    this.geocoder = new (window as any).google.maps.Geocoder();
  }

  setChatState(state: ChatState) {
    this.chatState = state;
  }

  private _clearMapElements() {
    [this.marker, this.routePolyline, this.originMarker, this.destinationMarker].forEach(el => el?.remove());
    this.marker = this.routePolyline = this.originMarker = this.destinationMarker = undefined;
  }

  private async _handleViewLocation(locationQuery: string) {
    if (!this.mapInitialized || !this.geocoder) return;
    this._clearMapElements();
    this.geocoder.geocode({address: locationQuery}, (results: any, status: string) => {
      if (status === 'OK' && results?.[0] && this.map) {
        const location = results[0].geometry.location;
        this.map.flyCameraTo({
          endCamera: {
            center: {lat: location.lat(), lng: location.lng(), altitude: 0},
            heading: 0, tilt: 67.5, range: 2000,
          },
          durationMillis: 1500,
        });
        this.marker = new this.Marker3DElement();
        this.marker.position = {lat: location.lat(), lng: location.lng(), altitude: 0};
        this.marker.label = locationQuery.slice(0, 30);
        this.map.appendChild(this.marker);
      }
    });
  }

  private async _handleDirections(origin: string, dest: string) {
    if (!this.mapInitialized || !this.directionsService) return;
    this._clearMapElements();
    this.directionsService.route(
      {origin, destination: dest, travelMode: (window as any).google.maps.TravelMode.DRIVING},
      (response: any, status: string) => {
        if (status === 'OK' && response.routes?.[0]) {
          const route = response.routes[0];
          const path = route.overview_path.map((p: any) => ({lat: p.lat(), lng: p.lng(), altitude: 5}));
          this.routePolyline = new this.Polyline3DElement();
          this.routePolyline.coordinates = path;
          this.routePolyline.strokeColor = '#4285F4';
          this.routePolyline.strokeWidth = 8;
          this.map.appendChild(this.routePolyline);

          const start = route.legs[0].start_location;
          this.originMarker = new this.Marker3DElement();
          this.originMarker.position = {lat: start.lat(), lng: start.lng(), altitude: 0};
          this.originMarker.label = 'A';
          this.map.appendChild(this.originMarker);

          const end = route.legs[0].end_location;
          this.destinationMarker = new this.Marker3DElement();
          this.destinationMarker.position = {lat: end.lat(), lng: end.lng(), altitude: 0};
          this.destinationMarker.label = 'B';
          this.map.appendChild(this.destinationMarker);

          const center = route.bounds.getCenter();
          this.map.flyCameraTo({
            endCamera: {center: {lat: center.lat(), lng: center.lng(), altitude: 0}, heading: 0, tilt: 45, range: 10000},
            durationMillis: 2000,
          });
        }
      }
    );
  }

  async handleMapQuery(params: MapParams) {
    if (params.location) this._handleViewLocation(params.location);
    else if (params.origin && params.destination) this._handleDirections(params.origin, params.destination);
  }

  addMessage(role: string, message: string) {
    const div = document.createElement('div');
    div.classList.add('turn', `role-${role.trim()}`);

    const thinkingDetails = document.createElement('details');
    thinkingDetails.classList.add('thinking', 'hidden');
    const summary = document.createElement('summary');
    summary.textContent = 'Thinking...';
    const thinkingElement = document.createElement('div');
    thinkingDetails.append(summary, thinkingElement);
    div.append(thinkingDetails);

    const textElement = document.createElement('div');
    textElement.className = 'text';
    textElement.innerHTML = message;
    div.append(textElement);

    this.messages = [...this.messages, div];
    this.scrollToTheEnd();
    return {thinkingContainer: thinkingDetails, thinkingElement, textElement};
  }

  scrollToTheEnd() {
    setTimeout(() => this.anchor?.scrollIntoView({behavior: 'smooth', block: 'end'}), 50);
  }

  async sendMessageAction() {
    if (this.chatState !== ChatState.IDLE || !this.inputMessage.trim()) return;
    const msg = this.inputMessage.trim();
    this.inputMessage = '';
    const {textElement} = this.addMessage('user', '...');
    textElement.innerHTML = await marked.parse(msg);
    if (this.sendMessageHandler) await this.sendMessageHandler(msg, 'user');
    this.setNewRandomPrompt();
  }

  render() {
    return html`
      <div class="gdm-map-app">
        <div class="main-container">
          ${this.mapError ? html`<div class="map-error-message">${this.mapError}</div>` : ''}
          <gmp-map-3d id="mapContainer" mode="hybrid" center="0,0,100" heading="0" tilt="45" range="20000000" default-ui-disabled="true"></gmp-map-3d>
        </div>
        <div class="sidebar">
          <div class="selector" role="tablist">
            <button class="selected-tab">Gemini</button>
          </div>
          <div class="showtab">
            <div class="chat-messages">
              ${this.messages}
              <div id="anchor"></div>
            </div>
            <div class="footer">
              <div id="chatStatus" class=${classMap({hidden: this.chatState === ChatState.IDLE})}>
                ${ICON_BUSY} ${this.chatState === ChatState.THINKING ? 'Thinking' : 'Generating'}...
              </div>
              <div id="inputArea">
                <input type="text" id="messageInput" .value=${this.inputMessage} 
                  @input=${(e: any) => this.inputMessage = e.target.value}
                  @keydown=${(e: any) => e.key === 'Enter' && this.sendMessageAction()}
                  placeholder="Ask about a place..." />
                <button id="sendButton" @click=${this.sendMessageAction} ?disabled=${this.chatState !== ChatState.IDLE}>
                  <svg viewBox="0 -960 960 960" height="20" width="20" fill="currentColor"><path d="M120-160v-240l320-80-320-80v-240l760 320-760 320Z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }
}
