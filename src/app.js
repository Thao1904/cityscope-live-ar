// Entry point, same pipeline as 8thwall/threejs-world-effects-example,
// with the CityScope module in place of the sample cube.
import * as THREE from 'three'
import {cityscopePipelineModule} from './cityscope-ar'

window.THREE = THREE

const onxrloaded = () => {
  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),      // Draws the camera feed.
    XR8.Threejs.pipelineModule(),                // Creates a three.js AR scene.
    XR8.XrController.pipelineModule(),           // Enables SLAM (world) tracking.
    LandingPage.pipelineModule(),                // Shows a QR code on desktop / unsupported browsers.
    XRExtras.FullWindowCanvas.pipelineModule(),
    XRExtras.Loading.pipelineModule(),
    XRExtras.RuntimeError.pipelineModule(),
    cityscopePipelineModule(),                   // CityScope table, layers and proposals.
  ])
  XR8.run({canvas: document.getElementById('camerafeed')})
}

window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
