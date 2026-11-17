// Shared artwork: teacher and student use the same seat-based character.
export function pupil(seat=1) {
 const shirt=['#88b9a1','#e4a47f','#b2a0ce'][Math.abs(Number(seat)||1)%3];
 return `<svg class="pixel-pupil" xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" aria-hidden="true" shape-rendering="crispEdges"><path fill="#173d37" d="M8 2h16v4h4v16H4V6h4z"/><path fill="#edbc96" d="M8 8h16v14H8z"/><path fill="#173d37" d="M10 12h3v3h-3zM19 12h3v3h-3zM13 19h6v2h-6z"/><path fill="${shirt}" d="M8 23h16v12H8z"/><path class="pupil-arm left" fill="#edbc96" d="M4 24h4v9H4z"/><path class="pupil-arm right" fill="#edbc96" d="M24 24h4v9h-4z"/><path class="pupil-leg left" fill="#173d37" d="M9 34h6v6H9z"/><path class="pupil-leg right" fill="#173d37" d="M18 34h6v6h-6z"/></svg>`;
}
export function pixelIcon(name) {
 const paths={classroom:'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18',fullscreen:'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6',close:'m6 6 12 12M6 18 18 6',previous:'m14 5-7 7 7 7M7 12h14',next:'m10 5 7 7-7 7M3 12h14',switch:'M5 19 19 5M8 5h11v11',stay:'M12 20V4m-7 7 7-7 7 7',hold:'M4 12h3m4 0h3m4 0h3'};
 return `<svg class="pixel-icon teacher-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="${paths[name]||paths.next}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/></svg>`;
}

export const robot = (size='') => `<svg class="robot ${size}" viewBox="0 0 24 27" role="img" aria-label="픽셀 AI 로봇 회로" shape-rendering="crispEdges"><path fill="#173d37" d="M11 0h2v4h7v2h2v13h-2v3h-3v3h-3v-3h-4v3H7v-3H4v-3H2V6h2V4h7z"/><path fill="#79d6a7" d="M4 6h16v13H4zM7 20h10v2H7z"/><path fill="#f5f1df" d="M6 8h12v8H6z"/><path fill="#173d37" d="M7 10h3v3H7zM14 10h3v3h-3zM10 15h4v1h-4z"/><path fill="#ee956c" d="M11 0h2v2h-2zM4 16h3v2H4zM17 16h3v2h-3z"/><path fill="#173d37" d="M0 10h2v7H0zM22 10h2v7h-2z"/></svg>`;
