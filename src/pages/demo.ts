import { getDemo } from '../demos/registry';
import { Viewer } from '../scene';
import { navigate } from '../router';

const GITHUB_URL = 'https://github.com/hoainho/img2threejs';

/**
 * Renders the full-viewport demo viewer + info panel for `id`.
 * Returns a cleanup function the router must call before switching routes.
 * If `id` is unknown, redirects to home and returns a no-op cleanup.
 */
export function renderDemo(mount: HTMLElement, id: string): () => void {
  const demo = getDemo(id);
  if (!demo) {
    navigate('#/');
    return () => {};
  }

  const compactPanel = window.matchMedia('(max-width: 640px)').matches;

  mount.innerHTML = `
    <div class="demo-page">
      <div class="demo-canvas-mount" id="demo-canvas-mount"></div>
      <details class="demo-panel"${compactPanel ? '' : ' open'}>
        <summary class="demo-panel-summary">${demo.title} &middot; details</summary>
        <div class="demo-panel-content">
          <a class="back-link" href="#/">&larr; Back to gallery</a>
          <h2>${demo.title}</h2>
          <p class="demo-author">by
            <a href="${demo.authorUrl}" target="_blank" rel="noopener noreferrer">${demo.author}</a>
          </p>
          <img class="demo-ref-thumb" src="${demo.referenceImage}" alt="${demo.title} reference" />
          <div class="demo-meta">
            <span class="badge badge-${demo.subjectClass}">${demo.subjectClass}</span>
            <span class="badge">${demo.generatedWith}</span>
            <span class="badge">${demo.status}</span>
            <p>${demo.blurb}</p>
          </div>
          <div class="demo-links">
            ${
              demo.sourceUrl
                ? `<a class="btn" href="${demo.sourceUrl}" target="_blank" rel="noopener noreferrer">
                    View generated source
                  </a>`
                : ''
            }
            <a class="btn btn-star" href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">
              &#9733; Star img2threejs on GitHub
            </a>
          </div>
        </div>
      </details>
      <div class="hint">drag / swipe to orbit &middot; scroll / pinch to zoom</div>
    </div>
  `;

  const canvasMount = mount.querySelector<HTMLDivElement>('#demo-canvas-mount')!;
  const viewer = new Viewer(canvasMount, {
    cameraPosition: demo.cameraPosition,
    cameraTarget: demo.cameraTarget,
    cameraFov: demo.cameraFov,
  });

  demo.build(viewer.scene);
  viewer.start();

  return () => viewer.dispose();
}
