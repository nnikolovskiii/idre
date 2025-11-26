import { Object3DNode } from '@react-three/fiber'
import { AmbientLight, DirectionalLight, Group, Mesh, Object3D, PointLight } from 'three'

declare module '@react-three/fiber' {
    interface ThreeElements {
        ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
        directionalLight: Object3DNode<DirectionalLight, typeof DirectionalLight>
        pointLight: Object3DNode<PointLight, typeof PointLight>
        primitive: Object3DNode<Object3D, typeof Object3D>
        group: Object3DNode<Group, typeof Group>
        mesh: Object3DNode<Mesh, typeof Mesh>
    }
}