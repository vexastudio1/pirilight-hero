import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';

const [, , input, output] = process.argv;

const io = new NodeIO();
const document = await io.read(input);
const root = document.getRoot();

const cubeNode = root.listNodes().find((n) => n.getName() === 'Cube');
if (!cubeNode) {
  throw new Error('Node "Cube" not found — aborting to avoid silently changing the model.');
}

for (const scene of root.listScenes()) {
  scene.removeChild(cubeNode);
}
cubeNode.dispose();

await document.transform(prune());
await io.write(output, document);

console.log(`Removed "Cube" node. Wrote ${output}`);
