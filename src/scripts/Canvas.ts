import * as THREE from 'three'
import { Three } from './core/Three'
import { RawShaderMaterial } from './core/ExtendedMaterials'
import { FS, shader } from './shader/shader'

export class Canvas extends Three {
  private readonly camera: THREE.OrthographicCamera

  private positionFBOs: THREE.WebGLRenderTarget[] = []
  private directionFBO: THREE.WebGLRenderTarget

  private isClick = false
  private clickPos: [number, number] = [-1, -1]

  private sandColors = [0xd9bd86, 0xd2b170, 0xcfa44e, 0xcbad72, 0xc7a257, 0xc59a44, 0xd5a33f]
  private prevSandColor = this.sandColors[0]

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)

    this.camera = new THREE.OrthographicCamera()
    this.positionFBOs = [this.createSimulationFBO(), this.createSimulationFBO()]
    this.directionFBO = this.createSimulationFBO()

    this.init()
    this.createPlanes()

    this.addMouseEvents()
    window.addEventListener('resize', this.resize.bind(this))
    this.renderer.setAnimationLoop(this.anime.bind(this))
    // this.intervalAnimation(this.anime.bind(this), 60)
  }

  private init() {
    this.scene.background = new THREE.Color('#000')
  }

  private get fboResolution() {
    const aspect = this.size.aspect
    const height = 100
    const width = Math.round(height * aspect)
    return { width, height }
  }

  private createSimulationFBO() {
    const { width, height } = this.fboResolution
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    })
    return renderTarget
  }

  private createPlane(name: FS, uniforms: { [uniform: string]: THREE.IUniform<any> }) {
    const geo = new THREE.PlaneGeometry(2, 2)
    const mat = new RawShaderMaterial({
      uniforms,
      vertexShader: shader.vs.base,
      fragmentShader: shader.fs[name],
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.name = name
    this.scene.add(mesh)
  }

  private createPlanes() {
    this.createPlane('input', {
      resolution: { value: [this.fboResolution.width, this.fboResolution.height] },
      positionMap: { value: null },
      clickPos: { value: [0, 0] },
      sandColor: { value: new THREE.Color().setHex(this.sandColor) },
    })

    this.createPlane('direction', {
      resolution: { value: [this.fboResolution.width, this.fboResolution.height] },
      positionMap: { value: null },
    })

    this.createPlane('update', {
      resolution: { value: [this.fboResolution.width, this.fboResolution.height] },
      positionMap: { value: null },
      directionMap: { value: null },
      frame: { value: 0 },
    })

    this.createPlane('output', {
      positionMap: { value: null },
    })
  }

  private addMouseEvents() {
    const updateClickPos = (e: MouseEvent | Touch) => {
      const x = e.clientX / window.innerWidth
      const y = 1.0 - e.clientY / window.innerHeight
      this.clickPos = [x, y]
    }

    window.addEventListener('mousedown', (e) => {
      this.isClick = true
      updateClickPos(e)
      const uniforms = this.uniforms('input')
      uniforms.sandColor.value.setHex(this.sandColor)
    })

    window.addEventListener('mousemove', (e) => {
      updateClickPos(e)
    })

    window.addEventListener('mouseup', () => {
      this.isClick = false
    })

    window.addEventListener('touchstart', (e) => {
      this.isClick = true
      updateClickPos(e.touches[0])
      const uniforms = this.uniforms('input')
      uniforms.sandColor.value.setHex(this.sandColor)
    })

    window.addEventListener('touchmove', (e) => {
      updateClickPos(e.touches[0])
    })

    window.addEventListener('touchend', () => {
      this.isClick = false
    })
  }

  private anime() {
    {
      this.use('input')
      const uniforms = this.uniforms('input')
      uniforms.positionMap.value = this.texture(this.positionFBOs[0])
      uniforms.clickPos.value = this.isClick ? this.clickPos : [-1, -1]
      this.renderer.setRenderTarget(this.positionFBOs[1])
      this.renderer.render(this.scene, this.camera)
      this.swap(this.positionFBOs)
    }

    {
      this.use('direction')
      const uniforms = this.uniforms('direction')
      uniforms.positionMap.value = this.texture(this.positionFBOs[0])
      this.renderer.setRenderTarget(this.directionFBO)
      this.renderer.render(this.scene, this.camera)
    }

    {
      this.use('update')
      const uniforms = this.uniforms('update')
      uniforms.positionMap.value = this.texture(this.positionFBOs[0])
      uniforms.directionMap.value = this.texture(this.directionFBO)
      uniforms.frame.value += 1
      this.renderer.setRenderTarget(this.positionFBOs[1])
      this.renderer.render(this.scene, this.camera)
      this.swap(this.positionFBOs)
    }

    {
      this.use('output')
      const uniforms = this.uniforms('output')
      uniforms.positionMap.value = this.texture(this.positionFBOs[0])
      this.render(this.camera)
    }
  }

  private resize() {
    const { width, height } = this.fboResolution
    this.positionFBOs.forEach((fbo) => fbo.setSize(width, height))
    this.directionFBO.setSize(width, height)

    {
      const uniforms = this.uniforms('input')
      uniforms.resolution.value = [width, height]
    }
    {
      const uniforms = this.uniforms('direction')
      uniforms.resolution.value = [width, height]
    }
    {
      const uniforms = this.uniforms('update')
      uniforms.resolution.value = [width, height]
    }
  }

  // utils

  private use(name: FS) {
    this.scene.children.forEach((c) => {
      if (c instanceof THREE.Mesh) {
        c.visible = c.name === name
      }
    })
  }

  private texture(rt: THREE.WebGLRenderTarget) {
    return rt.texture
  }

  private swap(renderTargets: THREE.WebGLRenderTarget[]) {
    const temp = renderTargets[0]
    renderTargets[0] = renderTargets[1]
    renderTargets[1] = temp
  }

  private uniforms(name: FS) {
    return (this.scene.getObjectByName(name) as THREE.Mesh<THREE.BufferGeometry, RawShaderMaterial>).material.uniforms
  }

  private get sandColor() {
    let col = this.sandColors[Math.trunc(Math.random() * this.sandColors.length)]
    for (let i = 0; i < 10; i++) {
      if (col !== this.prevSandColor) break
      col = this.sandColors[Math.trunc(Math.random() * this.sandColors.length)]
    }
    this.prevSandColor = col
    return col
  }
}
