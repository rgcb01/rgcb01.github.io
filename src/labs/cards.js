// Publication card formats (pixels). Shared by the card route (LabShareCard.jsx) and scripts/labs/publish.mjs.
// Video formats leave a slot where the SimuLab render (frame interior 1504 x 1184) is composited by ffmpeg.
export const CARD_FORMATS = {
  og: { w: 1200, h: 630, use: 'Open Graph / link preview (LinkedIn, X, Slack)' },
  linkedin: { w: 1080, h: 1350, use: 'LinkedIn image post, 4:5 portrait' },
  x: { w: 1600, h: 900, use: 'X image post, 16:9' },
  'video-linkedin': { w: 1080, h: 1350, slot: { x: 0, y: 262, w: 1080, h: 850 }, use: 'LinkedIn native video, 4:5' },
  'video-x': { w: 1920, h: 1080, slot: { x: 548, y: 0, w: 1372, h: 1080 }, use: 'X native video, 16:9' },
};
