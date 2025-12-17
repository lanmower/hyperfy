
import * as THREE from 'three';
import { BufferAttribute } from 'three';



class VRMExpression extends THREE.Object3D {
    
    get overrideBlinkAmount() {
        if (this.overrideBlink === 'block') {
            return 0.0 < this.weight ? 1.0 : 0.0;
        }
        else if (this.overrideBlink === 'blend') {
            return this.weight;
        }
        else {
            return 0.0;
        }
    }
    
    get overrideLookAtAmount() {
        if (this.overrideLookAt === 'block') {
            return 0.0 < this.weight ? 1.0 : 0.0;
        }
        else if (this.overrideLookAt === 'blend') {
            return this.weight;
        }
        else {
            return 0.0;
        }
    }
    
    get overrideMouthAmount() {
        if (this.overrideMouth === 'block') {
            return 0.0 < this.weight ? 1.0 : 0.0;
        }
        else if (this.overrideMouth === 'blend') {
            return this.weight;
        }
        else {
            return 0.0;
        }
    }
    constructor(expressionName) {
        super();
        
        this.weight = 0.0;
        
        this.isBinary = false;
        
        this.overrideBlink = 'none';
        
        this.overrideLookAt = 'none';
        
        this.overrideMouth = 'none';
        this._binds = [];
        this.name = `VRMExpression_${expressionName}`;
        this.expressionName = expressionName;
        this.type = 'VRMExpression';
        this.visible = false;
    }
    addBind(bind) {
        this._binds.push(bind);
    }
    
    applyWeight(options) {
        var _a;
        let actualWeight = this.isBinary ? (this.weight <= 0.5 ? 0.0 : 1.0) : this.weight;
        actualWeight *= (_a = options === null || options === void 0 ? void 0 : options.multiplier) !== null && _a !== void 0 ? _a : 1.0;
        this._binds.forEach((bind) => bind.applyWeight(actualWeight));
    }
    
    clearAppliedWeight() {
        this._binds.forEach((bind) => bind.clearAppliedWeight());
    }
}



function __awaiter$6(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function extractPrimitivesInternal(gltf, nodeIndex, node) {
    var _a, _b;
    const json = gltf.parser.json;
    
    const schemaNode = (_a = json.nodes) === null || _a === void 0 ? void 0 : _a[nodeIndex];
    if (schemaNode == null) {
        console.warn(`extractPrimitivesInternal: Attempt to use nodes[${nodeIndex}] of glTF but the node doesn't exist`);
        return null;
    }
    const meshIndex = schemaNode.mesh;
    if (meshIndex == null) {
        return null;
    }
    const schemaMesh = (_b = json.meshes) === null || _b === void 0 ? void 0 : _b[meshIndex];
    if (schemaMesh == null) {
        console.warn(`extractPrimitivesInternal: Attempt to use meshes[${meshIndex}] of glTF but the mesh doesn't exist`);
        return null;
    }
    const primitiveCount = schemaMesh.primitives.length;
    const primitives = [];
    node.traverse((object) => {
        if (primitives.length < primitiveCount) {
            if (object.isMesh) {
                primitives.push(object);
            }
        }
    });
    return primitives;
}

function gltfExtractPrimitivesFromNode(gltf, nodeIndex) {
    return __awaiter$6(this, void 0, void 0, function* () {
        const node = yield gltf.parser.getDependency('node', nodeIndex);
        return extractPrimitivesInternal(gltf, nodeIndex, node);
    });
}

function gltfExtractPrimitivesFromNodes(gltf) {
    return __awaiter$6(this, void 0, void 0, function* () {
        const nodes = yield gltf.parser.getDependencies('node');
        const map = new Map();
        nodes.forEach((node, index) => {
            const result = extractPrimitivesInternal(gltf, index, node);
            if (result != null) {
                map.set(index, result);
            }
        });
        return map;
    });
}


function gltfGetAssociatedMaterialIndex(parser, material) {
    var _a, _b;
    const threeRevision = parseInt(THREE.REVISION, 10);
    let index = null;
    if (threeRevision >= 133) {
        index = (_b = (_a = parser.associations.get(material)) === null || _a === void 0 ? void 0 : _a.materials) !== null && _b !== void 0 ? _b : null;
    }
    else {
        const associations = parser.associations;
        const reference = associations.get(material);
        if ((reference === null || reference === void 0 ? void 0 : reference.type) === 'materials') {
            index = reference.index;
        }
    }
    return index;
}


const VRMExpressionPresetName = {
    Aa: 'aa',
    Ih: 'ih',
    Ou: 'ou',
    Ee: 'ee',
    Oh: 'oh',
    Blink: 'blink',
    Happy: 'happy',
    Angry: 'angry',
    Sad: 'sad',
    Relaxed: 'relaxed',
    LookUp: 'lookUp',
    Surprised: 'surprised',
    LookDown: 'lookDown',
    LookLeft: 'lookLeft',
    LookRight: 'lookRight',
    BlinkLeft: 'blinkLeft',
    BlinkRight: 'blinkRight',
    Neutral: 'neutral',
};


function saturate(value) {
    return Math.max(Math.min(value, 1.0), 0.0);
}

class VRMExpressionManager {
    get expressions() {
        return this._expressions.concat();
    }
    get expressionMap() {
        return Object.assign({}, this._expressionMap);
    }
    
    get presetExpressionMap() {
        const result = {};
        const presetNameSet = new Set(Object.values(VRMExpressionPresetName));
        Object.entries(this._expressionMap).forEach(([name, expression]) => {
            if (presetNameSet.has(name)) {
                result[name] = expression;
            }
        });
        return result;
    }
    
    get customExpressionMap() {
        const result = {};
        const presetNameSet = new Set(Object.values(VRMExpressionPresetName));
        Object.entries(this._expressionMap).forEach(([name, expression]) => {
            if (!presetNameSet.has(name)) {
                result[name] = expression;
            }
        });
        return result;
    }
    
    constructor() {
        
        this.blinkExpressionNames = ['blink', 'blinkLeft', 'blinkRight'];
        
        this.lookAtExpressionNames = ['lookLeft', 'lookRight', 'lookUp', 'lookDown'];
        
        this.mouthExpressionNames = ['aa', 'ee', 'ih', 'oh', 'ou'];
        
        this._expressions = [];
        
        this._expressionMap = {};
    }
    
    copy(source) {
        const expressions = this._expressions.concat();
        expressions.forEach((expression) => {
            this.unregisterExpression(expression);
        });
        source._expressions.forEach((expression) => {
            this.registerExpression(expression);
        });
        this.blinkExpressionNames = source.blinkExpressionNames.concat();
        this.lookAtExpressionNames = source.lookAtExpressionNames.concat();
        this.mouthExpressionNames = source.mouthExpressionNames.concat();
        return this;
    }
    
    clone() {
        return new VRMExpressionManager().copy(this);
    }
    
    getExpression(name) {
        var _a;
        return (_a = this._expressionMap[name]) !== null && _a !== void 0 ? _a : null;
    }
    
    registerExpression(expression) {
        this._expressions.push(expression);
        this._expressionMap[expression.expressionName] = expression;
    }
    
    unregisterExpression(expression) {
        const index = this._expressions.indexOf(expression);
        if (index === -1) {
            console.warn('VRMExpressionManager: The specified expressions is not registered');
        }
        this._expressions.splice(index, 1);
        delete this._expressionMap[expression.expressionName];
    }
    
    getValue(name) {
        var _a;
        const expression = this.getExpression(name);
        return (_a = expression === null || expression === void 0 ? void 0 : expression.weight) !== null && _a !== void 0 ? _a : null;
    }
    
    setValue(name, weight) {
        const expression = this.getExpression(name);
        if (expression) {
            expression.weight = saturate(weight);
        }
    }
    
    getExpressionTrackName(name) {
        const expression = this.getExpression(name);
        return expression ? `${expression.name}.weight` : null;
    }
    
    update() {
        const weightMultipliers = this._calculateWeightMultipliers();
        this._expressions.forEach((expression) => {
            expression.clearAppliedWeight();
        });
        this._expressions.forEach((expression) => {
            let multiplier = 1.0;
            const name = expression.expressionName;
            if (this.blinkExpressionNames.indexOf(name) !== -1) {
                multiplier *= weightMultipliers.blink;
            }
            if (this.lookAtExpressionNames.indexOf(name) !== -1) {
                multiplier *= weightMultipliers.lookAt;
            }
            if (this.mouthExpressionNames.indexOf(name) !== -1) {
                multiplier *= weightMultipliers.mouth;
            }
            expression.applyWeight({ multiplier });
        });
    }
    
    _calculateWeightMultipliers() {
        let blink = 1.0;
        let lookAt = 1.0;
        let mouth = 1.0;
        this._expressions.forEach((expression) => {
            blink -= expression.overrideBlinkAmount;
            lookAt -= expression.overrideLookAtAmount;
            mouth -= expression.overrideMouthAmount;
        });
        blink = Math.max(0.0, blink);
        lookAt = Math.max(0.0, lookAt);
        mouth = Math.max(0.0, mouth);
        return { blink, lookAt, mouth };
    }
}


const VRMExpressionMaterialColorType = {
    Color: 'color',
    EmissionColor: 'emissionColor',
    ShadeColor: 'shadeColor',
    MatcapColor: 'matcapColor',
    RimColor: 'rimColor',
    OutlineColor: 'outlineColor',
};
const v0ExpressionMaterialColorMap = {
    _Color: VRMExpressionMaterialColorType.Color,
    _EmissionColor: VRMExpressionMaterialColorType.EmissionColor,
    _ShadeColor: VRMExpressionMaterialColorType.ShadeColor,
    _RimColor: VRMExpressionMaterialColorType.RimColor,
    _OutlineColor: VRMExpressionMaterialColorType.OutlineColor,
};

const _color = new THREE.Color();

class VRMExpressionMaterialColorBind {
    constructor({ material, type, targetValue, targetAlpha, }) {
        this.material = material;
        this.type = type;
        this.targetValue = targetValue;
        this.targetAlpha = targetAlpha !== null && targetAlpha !== void 0 ? targetAlpha : 1.0;
        const color = this._initColorBindState();
        const alpha = this._initAlphaBindState();
        this._state = { color, alpha };
    }
    applyWeight(weight) {
        const { color, alpha } = this._state;
        if (color != null) {
            const { propertyName, deltaValue } = color;
            const target = this.material[propertyName];
            if (target != undefined) {
                target.add(_color.copy(deltaValue).multiplyScalar(weight));
            }
        }
        if (alpha != null) {
            const { propertyName, deltaValue } = alpha;
            const target = this.material[propertyName];
            if (target != undefined) {
                this.material[propertyName] += deltaValue * weight;
            }
        }
    }
    clearAppliedWeight() {
        const { color, alpha } = this._state;
        if (color != null) {
            const { propertyName, initialValue } = color;
            const target = this.material[propertyName];
            if (target != undefined) {
                target.copy(initialValue);
            }
        }
        if (alpha != null) {
            const { propertyName, initialValue } = alpha;
            const target = this.material[propertyName];
            if (target != undefined) {
                this.material[propertyName] = initialValue;
            }
        }
    }
    _initColorBindState() {
        var _a, _b, _c;
        const { material, type, targetValue } = this;
        const propertyNameMap = this._getPropertyNameMap();
        const propertyName = (_b = (_a = propertyNameMap === null || propertyNameMap === void 0 ? void 0 : propertyNameMap[type]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null;
        if (propertyName == null) {
            console.warn(`Tried to add a material color bind to the material ${(_c = material.name) !== null && _c !== void 0 ? _c : '(no name)'}, the type ${type} but the material or the type is not supported.`);
            return null;
        }
        const target = material[propertyName];
        const initialValue = target.clone();
        const deltaValue = new THREE.Color(targetValue.r - initialValue.r, targetValue.g - initialValue.g, targetValue.b - initialValue.b);
        return { propertyName, initialValue, deltaValue };
    }
    _initAlphaBindState() {
        var _a, _b, _c;
        const { material, type, targetAlpha } = this;
        const propertyNameMap = this._getPropertyNameMap();
        const propertyName = (_b = (_a = propertyNameMap === null || propertyNameMap === void 0 ? void 0 : propertyNameMap[type]) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : null;
        if (propertyName == null && targetAlpha !== 1.0) {
            console.warn(`Tried to add a material alpha bind to the material ${(_c = material.name) !== null && _c !== void 0 ? _c : '(no name)'}, the type ${type} but the material or the type does not support alpha.`);
            return null;
        }
        if (propertyName == null) {
            return null;
        }
        const initialValue = material[propertyName];
        const deltaValue = targetAlpha - initialValue;
        return { propertyName, initialValue, deltaValue };
    }
    _getPropertyNameMap() {
        var _a, _b;
        return ((_b = (_a = Object.entries(VRMExpressionMaterialColorBind._propertyNameMapMap).find(([distinguisher]) => {
            return this.material[distinguisher] === true;
        })) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : null);
    }
}

VRMExpressionMaterialColorBind._propertyNameMapMap = {
    isMeshStandardMaterial: {
        color: ['color', 'opacity'],
        emissionColor: ['emissive', null],
    },
    isMeshBasicMaterial: {
        color: ['color', 'opacity'],
    },
    isMToonMaterial: {
        color: ['color', 'opacity'],
        emissionColor: ['emissive', null],
        outlineColor: ['outlineColorFactor', null],
        matcapColor: ['matcapFactor', null],
        rimColor: ['parametricRimColorFactor', null],
        shadeColor: ['shadeColorFactor', null],
    },
};


class VRMExpressionMorphTargetBind {
    constructor({ primitives, index, weight, }) {
        this.primitives = primitives;
        this.index = index;
        this.weight = weight;
    }
    applyWeight(weight) {
        this.primitives.forEach((mesh) => {
            var _a;
            if (((_a = mesh.morphTargetInfluences) === null || _a === void 0 ? void 0 : _a[this.index]) != null) {
                mesh.morphTargetInfluences[this.index] += this.weight * weight;
            }
        });
    }
    clearAppliedWeight() {
        this.primitives.forEach((mesh) => {
            var _a;
            if (((_a = mesh.morphTargetInfluences) === null || _a === void 0 ? void 0 : _a[this.index]) != null) {
                mesh.morphTargetInfluences[this.index] = 0.0;
            }
        });
    }
}

const _v2 = new THREE.Vector2();

class VRMExpressionTextureTransformBind {
    constructor({ material, scale, offset, }) {
        var _a, _b;
        this.material = material;
        this.scale = scale;
        this.offset = offset;
        const propertyNames = (_a = Object.entries(VRMExpressionTextureTransformBind._propertyNamesMap).find(([distinguisher]) => {
            return material[distinguisher] === true;
        })) === null || _a === void 0 ? void 0 : _a[1];
        if (propertyNames == null) {
            console.warn(`Tried to add a texture transform bind to the material ${(_b = material.name) !== null && _b !== void 0 ? _b : '(no name)'} but the material is not supported.`);
            this._properties = [];
        }
        else {
            this._properties = [];
            propertyNames.forEach((propertyName) => {
                var _a;
                const texture = (_a = material[propertyName]) === null || _a === void 0 ? void 0 : _a.clone();
                if (!texture) {
                    return null;
                }
                material[propertyName] = texture; // because the texture is cloned
                const initialOffset = texture.offset.clone();
                const initialScale = texture.repeat.clone();
                const deltaOffset = offset.clone().sub(initialOffset);
                const deltaScale = scale.clone().sub(initialScale);
                this._properties.push({
                    name: propertyName,
                    initialOffset,
                    deltaOffset,
                    initialScale,
                    deltaScale,
                });
            });
        }
    }
    applyWeight(weight) {
        this._properties.forEach((property) => {
            const target = this.material[property.name];
            if (target === undefined) {
                return;
            } // TODO: we should kick this at `addMaterialValue`
            target.offset.add(_v2.copy(property.deltaOffset).multiplyScalar(weight));
            target.repeat.add(_v2.copy(property.deltaScale).multiplyScalar(weight));
        });
    }
    clearAppliedWeight() {
        this._properties.forEach((property) => {
            const target = this.material[property.name];
            if (target === undefined) {
                return;
            } // TODO: we should kick this at `addMaterialValue`
            target.offset.copy(property.initialOffset);
            target.repeat.copy(property.initialScale);
        });
    }
}
VRMExpressionTextureTransformBind._propertyNamesMap = {
    isMeshStandardMaterial: [
        'map',
        'emissiveMap',
        'bumpMap',
        'normalMap',
        'displacementMap',
        'roughnessMap',
        'metalnessMap',
        'alphaMap',
    ],
    isMeshBasicMaterial: ['map', 'specularMap', 'alphaMap'],
    isMToonMaterial: [
        'map',
        'normalMap',
        'emissiveMap',
        'shadeMultiplyTexture',
        'rimMultiplyTexture',
        'outlineWidthMultiplyTexture',
        'uvAnimationMaskTexture',
    ],
};


const POSSIBLE_SPEC_VERSIONS$4 = new Set(['1.0', '1.0-beta']);

class VRMExpressionLoaderPlugin {
    get name() {
        return 'VRMExpressionLoaderPlugin';
    }
    constructor(parser) {
        this.parser = parser;
    }
    afterRoot(gltf) {
        return __awaiter$6(this, void 0, void 0, function* () {
            gltf.userData.vrmExpressionManager = yield this._import(gltf);
        });
    }
    
    _import(gltf) {
        return __awaiter$6(this, void 0, void 0, function* () {
            const v1Result = yield this._v1Import(gltf);
            if (v1Result) {
                return v1Result;
            }
            const v0Result = yield this._v0Import(gltf);
            if (v0Result) {
                return v0Result;
            }
            return null;
        });
    }
    _v1Import(gltf) {
        var _a, _b;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const isVRMUsed = ((_a = json.extensionsUsed) === null || _a === void 0 ? void 0 : _a.indexOf('VRMC_vrm')) !== -1;
            if (!isVRMUsed) {
                return null;
            }
            const extension = (_b = json.extensions) === null || _b === void 0 ? void 0 : _b['VRMC_vrm'];
            if (!extension) {
                return null;
            }
            const specVersion = extension.specVersion;
            if (!POSSIBLE_SPEC_VERSIONS$4.has(specVersion)) {
                console.warn(`VRMExpressionLoaderPlugin: Unknown VRMC_vrm specVersion "${specVersion}"`);
                return null;
            }
            const schemaExpressions = extension.expressions;
            if (!schemaExpressions) {
                return null;
            }
            const presetNameSet = new Set(Object.values(VRMExpressionPresetName));
            const nameSchemaExpressionMap = new Map();
            if (schemaExpressions.preset != null) {
                Object.entries(schemaExpressions.preset).forEach(([name, schemaExpression]) => {
                    if (schemaExpression == null) {
                        return;
                    } // typescript
                    if (!presetNameSet.has(name)) {
                        console.warn(`VRMExpressionLoaderPlugin: Unknown preset name "${name}" detected. Ignoring the expression`);
                        return;
                    }
                    nameSchemaExpressionMap.set(name, schemaExpression);
                });
            }
            if (schemaExpressions.custom != null) {
                Object.entries(schemaExpressions.custom).forEach(([name, schemaExpression]) => {
                    if (presetNameSet.has(name)) {
                        console.warn(`VRMExpressionLoaderPlugin: Custom expression cannot have preset name "${name}". Ignoring the expression`);
                        return;
                    }
                    nameSchemaExpressionMap.set(name, schemaExpression);
                });
            }
            const manager = new VRMExpressionManager();
            yield Promise.all(Array.from(nameSchemaExpressionMap.entries()).map(([name, schemaExpression]) => __awaiter$6(this, void 0, void 0, function* () {
                var _c, _d, _e, _f, _g, _h, _j;
                const expression = new VRMExpression(name);
                gltf.scene.add(expression);
                expression.isBinary = (_c = schemaExpression.isBinary) !== null && _c !== void 0 ? _c : false;
                expression.overrideBlink = (_d = schemaExpression.overrideBlink) !== null && _d !== void 0 ? _d : 'none';
                expression.overrideLookAt = (_e = schemaExpression.overrideLookAt) !== null && _e !== void 0 ? _e : 'none';
                expression.overrideMouth = (_f = schemaExpression.overrideMouth) !== null && _f !== void 0 ? _f : 'none';
                (_g = schemaExpression.morphTargetBinds) === null || _g === void 0 ? void 0 : _g.forEach((bind) => __awaiter$6(this, void 0, void 0, function* () {
                    var _k;
                    if (bind.node === undefined || bind.index === undefined) {
                        return;
                    }
                    const primitives = (yield gltfExtractPrimitivesFromNode(gltf, bind.node));
                    const morphTargetIndex = bind.index;
                    if (!primitives.every((primitive) => Array.isArray(primitive.morphTargetInfluences) &&
                        morphTargetIndex < primitive.morphTargetInfluences.length)) {
                        console.warn(`VRMExpressionLoaderPlugin: ${schemaExpression.name} attempts to index morph #${morphTargetIndex} but not found.`);
                        return;
                    }
                    expression.addBind(new VRMExpressionMorphTargetBind({
                        primitives,
                        index: morphTargetIndex,
                        weight: (_k = bind.weight) !== null && _k !== void 0 ? _k : 1.0,
                    }));
                }));
                if (schemaExpression.materialColorBinds || schemaExpression.textureTransformBinds) {
                    const gltfMaterials = [];
                    gltf.scene.traverse((object) => {
                        const material = object.material;
                        if (material) {
                            gltfMaterials.push(material);
                        }
                    });
                    (_h = schemaExpression.materialColorBinds) === null || _h === void 0 ? void 0 : _h.forEach((bind) => __awaiter$6(this, void 0, void 0, function* () {
                        const materials = gltfMaterials.filter((material) => {
                            const materialIndex = gltfGetAssociatedMaterialIndex(this.parser, material);
                            return bind.material === materialIndex;
                        });
                        materials.forEach((material) => {
                            expression.addBind(new VRMExpressionMaterialColorBind({
                                material,
                                type: bind.type,
                                targetValue: new THREE.Color().fromArray(bind.targetValue),
                                targetAlpha: bind.targetValue[3],
                            }));
                        });
                    }));
                    (_j = schemaExpression.textureTransformBinds) === null || _j === void 0 ? void 0 : _j.forEach((bind) => __awaiter$6(this, void 0, void 0, function* () {
                        const materials = gltfMaterials.filter((material) => {
                            const materialIndex = gltfGetAssociatedMaterialIndex(this.parser, material);
                            return bind.material === materialIndex;
                        });
                        materials.forEach((material) => {
                            var _a, _b;
                            expression.addBind(new VRMExpressionTextureTransformBind({
                                material,
                                offset: new THREE.Vector2().fromArray((_a = bind.offset) !== null && _a !== void 0 ? _a : [0.0, 0.0]),
                                scale: new THREE.Vector2().fromArray((_b = bind.scale) !== null && _b !== void 0 ? _b : [1.0, 1.0]),
                            }));
                        });
                    }));
                }
                manager.registerExpression(expression);
            })));
            return manager;
        });
    }
    _v0Import(gltf) {
        var _a;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const vrmExt = (_a = json.extensions) === null || _a === void 0 ? void 0 : _a.VRM;
            if (!vrmExt) {
                return null;
            }
            const schemaBlendShape = vrmExt.blendShapeMaster;
            if (!schemaBlendShape) {
                return null;
            }
            const manager = new VRMExpressionManager();
            const schemaBlendShapeGroups = schemaBlendShape.blendShapeGroups;
            if (!schemaBlendShapeGroups) {
                return manager;
            }
            const blendShapeNameSet = new Set();
            yield Promise.all(schemaBlendShapeGroups.map((schemaGroup) => __awaiter$6(this, void 0, void 0, function* () {
                var _b;
                const v0PresetName = schemaGroup.presetName;
                const v1PresetName = (v0PresetName != null && VRMExpressionLoaderPlugin.v0v1PresetNameMap[v0PresetName]) || null;
                const name = v1PresetName !== null && v1PresetName !== void 0 ? v1PresetName : schemaGroup.name;
                if (name == null) {
                    console.warn('VRMExpressionLoaderPlugin: One of custom expressions has no name. Ignoring the expression');
                    return;
                }
                if (blendShapeNameSet.has(name)) {
                    console.warn(`VRMExpressionLoaderPlugin: An expression preset ${v0PresetName} has duplicated entries. Ignoring the expression`);
                    return;
                }
                blendShapeNameSet.add(name);
                const expression = new VRMExpression(name);
                gltf.scene.add(expression);
                expression.isBinary = (_b = schemaGroup.isBinary) !== null && _b !== void 0 ? _b : false;
                if (schemaGroup.binds) {
                    schemaGroup.binds.forEach((bind) => __awaiter$6(this, void 0, void 0, function* () {
                        var _c;
                        if (bind.mesh === undefined || bind.index === undefined) {
                            return;
                        }
                        const nodesUsingMesh = [];
                        (_c = json.nodes) === null || _c === void 0 ? void 0 : _c.forEach((node, i) => {
                            if (node.mesh === bind.mesh) {
                                nodesUsingMesh.push(i);
                            }
                        });
                        const morphTargetIndex = bind.index;
                        yield Promise.all(nodesUsingMesh.map((nodeIndex) => __awaiter$6(this, void 0, void 0, function* () {
                            var _d;
                            const primitives = (yield gltfExtractPrimitivesFromNode(gltf, nodeIndex));
                            if (!primitives.every((primitive) => Array.isArray(primitive.morphTargetInfluences) &&
                                morphTargetIndex < primitive.morphTargetInfluences.length)) {
                                console.warn(`VRMExpressionLoaderPlugin: ${schemaGroup.name} attempts to index ${morphTargetIndex}th morph but not found.`);
                                return;
                            }
                            expression.addBind(new VRMExpressionMorphTargetBind({
                                primitives,
                                index: morphTargetIndex,
                                weight: 0.01 * ((_d = bind.weight) !== null && _d !== void 0 ? _d : 100), // narrowing the range from [ 0.0 - 100.0 ] to [ 0.0 - 1.0 ]
                            }));
                        })));
                    }));
                }
                const materialValues = schemaGroup.materialValues;
                if (materialValues && materialValues.length !== 0) {
                    materialValues.forEach((materialValue) => {
                        if (materialValue.materialName === undefined ||
                            materialValue.propertyName === undefined ||
                            materialValue.targetValue === undefined) {
                            return;
                        }
                        
                        const materials = [];
                        gltf.scene.traverse((object) => {
                            if (object.material) {
                                const material = object.material;
                                if (Array.isArray(material)) {
                                    materials.push(...material.filter((mtl) => (mtl.name === materialValue.materialName ||
                                        mtl.name === materialValue.materialName + ' (Outline)') &&
                                        materials.indexOf(mtl) === -1));
                                }
                                else if (material.name === materialValue.materialName && materials.indexOf(material) === -1) {
                                    materials.push(material);
                                }
                            }
                        });
                        const materialPropertyName = materialValue.propertyName;
                        materials.forEach((material) => {
                            if (materialPropertyName === '_MainTex_ST') {
                                const scale = new THREE.Vector2(materialValue.targetValue[0], materialValue.targetValue[1]);
                                const offset = new THREE.Vector2(materialValue.targetValue[2], materialValue.targetValue[3]);
                                offset.y = 1.0 - offset.y - scale.y;
                                expression.addBind(new VRMExpressionTextureTransformBind({
                                    material,
                                    scale,
                                    offset,
                                }));
                                return;
                            }
                            const materialColorType = v0ExpressionMaterialColorMap[materialPropertyName];
                            if (materialColorType) {
                                expression.addBind(new VRMExpressionMaterialColorBind({
                                    material,
                                    type: materialColorType,
                                    targetValue: new THREE.Color().fromArray(materialValue.targetValue),
                                    targetAlpha: materialValue.targetValue[3],
                                }));
                                return;
                            }
                            console.warn(materialPropertyName + ' is not supported');
                        });
                    });
                }
                manager.registerExpression(expression);
            })));
            return manager;
        });
    }
}
VRMExpressionLoaderPlugin.v0v1PresetNameMap = {
    a: 'aa',
    e: 'ee',
    i: 'ih',
    o: 'oh',
    u: 'ou',
    blink: 'blink',
    joy: 'happy',
    angry: 'angry',
    sorrow: 'sad',
    fun: 'relaxed',
    lookup: 'lookUp',
    lookdown: 'lookDown',
    lookleft: 'lookLeft',
    lookright: 'lookRight',
    blink_l: 'blinkLeft',
    blink_r: 'blinkRight',
    neutral: 'neutral',
};


const VRMExpressionOverrideType = {
    None: 'none',
    Block: 'block',
    Blend: 'blend',
};

class VRMFirstPerson {
    
    constructor(humanoid, meshAnnotations) {
        this._firstPersonOnlyLayer = VRMFirstPerson.DEFAULT_FIRSTPERSON_ONLY_LAYER;
        this._thirdPersonOnlyLayer = VRMFirstPerson.DEFAULT_THIRDPERSON_ONLY_LAYER;
        this._initializedLayers = false;
        this.humanoid = humanoid;
        this.meshAnnotations = meshAnnotations;
    }
    
    copy(source) {
        if (this.humanoid !== source.humanoid) {
            throw new Error('VRMFirstPerson: humanoid must be same in order to copy');
        }
        this.meshAnnotations = source.meshAnnotations.map((annotation) => ({
            meshes: annotation.meshes.concat(),
            type: annotation.type,
        }));
        return this;
    }
    
    clone() {
        return new VRMFirstPerson(this.humanoid, this.meshAnnotations).copy(this);
    }
    
    get firstPersonOnlyLayer() {
        return this._firstPersonOnlyLayer;
    }
    
    get thirdPersonOnlyLayer() {
        return this._thirdPersonOnlyLayer;
    }
    
    setup({ firstPersonOnlyLayer = VRMFirstPerson.DEFAULT_FIRSTPERSON_ONLY_LAYER, thirdPersonOnlyLayer = VRMFirstPerson.DEFAULT_THIRDPERSON_ONLY_LAYER, } = {}) {
        if (this._initializedLayers) {
            return;
        }
        this._firstPersonOnlyLayer = firstPersonOnlyLayer;
        this._thirdPersonOnlyLayer = thirdPersonOnlyLayer;
        this.meshAnnotations.forEach((item) => {
            item.meshes.forEach((mesh) => {
                if (item.type === 'firstPersonOnly') {
                    mesh.layers.set(this._firstPersonOnlyLayer);
                    mesh.traverse((child) => child.layers.set(this._firstPersonOnlyLayer));
                }
                else if (item.type === 'thirdPersonOnly') {
                    mesh.layers.set(this._thirdPersonOnlyLayer);
                    mesh.traverse((child) => child.layers.set(this._thirdPersonOnlyLayer));
                }
                else if (item.type === 'auto') {
                    this._createHeadlessModel(mesh);
                }
            });
        });
        this._initializedLayers = true;
    }
    _excludeTriangles(triangles, bws, skinIndex, exclude) {
        let count = 0;
        if (bws != null && bws.length > 0) {
            for (let i = 0; i < triangles.length; i += 3) {
                const a = triangles[i];
                const b = triangles[i + 1];
                const c = triangles[i + 2];
                const bw0 = bws[a];
                const skin0 = skinIndex[a];
                if (bw0[0] > 0 && exclude.includes(skin0[0]))
                    continue;
                if (bw0[1] > 0 && exclude.includes(skin0[1]))
                    continue;
                if (bw0[2] > 0 && exclude.includes(skin0[2]))
                    continue;
                if (bw0[3] > 0 && exclude.includes(skin0[3]))
                    continue;
                const bw1 = bws[b];
                const skin1 = skinIndex[b];
                if (bw1[0] > 0 && exclude.includes(skin1[0]))
                    continue;
                if (bw1[1] > 0 && exclude.includes(skin1[1]))
                    continue;
                if (bw1[2] > 0 && exclude.includes(skin1[2]))
                    continue;
                if (bw1[3] > 0 && exclude.includes(skin1[3]))
                    continue;
                const bw2 = bws[c];
                const skin2 = skinIndex[c];
                if (bw2[0] > 0 && exclude.includes(skin2[0]))
                    continue;
                if (bw2[1] > 0 && exclude.includes(skin2[1]))
                    continue;
                if (bw2[2] > 0 && exclude.includes(skin2[2]))
                    continue;
                if (bw2[3] > 0 && exclude.includes(skin2[3]))
                    continue;
                triangles[count++] = a;
                triangles[count++] = b;
                triangles[count++] = c;
            }
        }
        return count;
    }
    _createErasedMesh(src, erasingBonesIndex) {
        const dst = new THREE.SkinnedMesh(src.geometry.clone(), src.material);
        dst.name = `${src.name}(erase)`;
        dst.frustumCulled = src.frustumCulled;
        dst.layers.set(this._firstPersonOnlyLayer);
        const geometry = dst.geometry;
        const skinIndexAttr = geometry.getAttribute('skinIndex');
        const skinIndexAttrArray = skinIndexAttr instanceof THREE.GLBufferAttribute ? [] : skinIndexAttr.array;
        const skinIndex = [];
        for (let i = 0; i < skinIndexAttrArray.length; i += 4) {
            skinIndex.push([
                skinIndexAttrArray[i],
                skinIndexAttrArray[i + 1],
                skinIndexAttrArray[i + 2],
                skinIndexAttrArray[i + 3],
            ]);
        }
        const skinWeightAttr = geometry.getAttribute('skinWeight');
        const skinWeightAttrArray = skinWeightAttr instanceof THREE.GLBufferAttribute ? [] : skinWeightAttr.array;
        const skinWeight = [];
        for (let i = 0; i < skinWeightAttrArray.length; i += 4) {
            skinWeight.push([
                skinWeightAttrArray[i],
                skinWeightAttrArray[i + 1],
                skinWeightAttrArray[i + 2],
                skinWeightAttrArray[i + 3],
            ]);
        }
        const index = geometry.getIndex();
        if (!index) {
            throw new Error("The geometry doesn't have an index buffer");
        }
        const oldTriangles = Array.from(index.array);
        const count = this._excludeTriangles(oldTriangles, skinWeight, skinIndex, erasingBonesIndex);
        const newTriangle = [];
        for (let i = 0; i < count; i++) {
            newTriangle[i] = oldTriangles[i];
        }
        geometry.setIndex(newTriangle);
        if (src.onBeforeRender) {
            dst.onBeforeRender = src.onBeforeRender;
        }
        dst.bind(new THREE.Skeleton(src.skeleton.bones, src.skeleton.boneInverses), new THREE.Matrix4());
        return dst;
    }
    _createHeadlessModelForSkinnedMesh(parent, mesh) {
        const eraseBoneIndexes = [];
        mesh.skeleton.bones.forEach((bone, index) => {
            if (this._isEraseTarget(bone))
                eraseBoneIndexes.push(index);
        });
        if (!eraseBoneIndexes.length) {
            mesh.layers.enable(this._thirdPersonOnlyLayer);
            mesh.layers.enable(this._firstPersonOnlyLayer);
            return;
        }
        mesh.layers.set(this._thirdPersonOnlyLayer);
        const newMesh = this._createErasedMesh(mesh, eraseBoneIndexes);
        parent.add(newMesh);
    }
    _createHeadlessModel(node) {
        if (node.type === 'Group') {
            node.layers.set(this._thirdPersonOnlyLayer);
            if (this._isEraseTarget(node)) {
                node.traverse((child) => child.layers.set(this._thirdPersonOnlyLayer));
            }
            else {
                const parent = new THREE.Group();
                parent.name = `_headless_${node.name}`;
                parent.layers.set(this._firstPersonOnlyLayer);
                node.parent.add(parent);
                node.children
                    .filter((child) => child.type === 'SkinnedMesh')
                    .forEach((child) => {
                    const skinnedMesh = child;
                    this._createHeadlessModelForSkinnedMesh(parent, skinnedMesh);
                });
            }
        }
        else if (node.type === 'SkinnedMesh') {
            const skinnedMesh = node;
            this._createHeadlessModelForSkinnedMesh(node.parent, skinnedMesh);
        }
        else {
            if (this._isEraseTarget(node)) {
                node.layers.set(this._thirdPersonOnlyLayer);
                node.traverse((child) => child.layers.set(this._thirdPersonOnlyLayer));
            }
        }
    }
    _isEraseTarget(bone) {
        if (bone === this.humanoid.getRawBoneNode('head')) {
            return true;
        }
        else if (!bone.parent) {
            return false;
        }
        else {
            return this._isEraseTarget(bone.parent);
        }
    }
}

VRMFirstPerson.DEFAULT_FIRSTPERSON_ONLY_LAYER = 9;

VRMFirstPerson.DEFAULT_THIRDPERSON_ONLY_LAYER = 10;


const POSSIBLE_SPEC_VERSIONS$3 = new Set(['1.0', '1.0-beta']);

class VRMFirstPersonLoaderPlugin {
    get name() {
        return 'VRMFirstPersonLoaderPlugin';
    }
    constructor(parser) {
        this.parser = parser;
    }
    afterRoot(gltf) {
        return __awaiter$6(this, void 0, void 0, function* () {
            const vrmHumanoid = gltf.userData.vrmHumanoid;
            if (vrmHumanoid === null) {
                return;
            }
            else if (vrmHumanoid === undefined) {
                throw new Error('VRMFirstPersonLoaderPlugin: vrmHumanoid is undefined. VRMHumanoidLoaderPlugin have to be used first');
            }
            gltf.userData.vrmFirstPerson = yield this._import(gltf, vrmHumanoid);
        });
    }
    
    _import(gltf, humanoid) {
        return __awaiter$6(this, void 0, void 0, function* () {
            if (humanoid == null) {
                return null;
            }
            const v1Result = yield this._v1Import(gltf, humanoid);
            if (v1Result) {
                return v1Result;
            }
            const v0Result = yield this._v0Import(gltf, humanoid);
            if (v0Result) {
                return v0Result;
            }
            return null;
        });
    }
    _v1Import(gltf, humanoid) {
        var _a, _b;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const isVRMUsed = ((_a = json.extensionsUsed) === null || _a === void 0 ? void 0 : _a.indexOf('VRMC_vrm')) !== -1;
            if (!isVRMUsed) {
                return null;
            }
            const extension = (_b = json.extensions) === null || _b === void 0 ? void 0 : _b['VRMC_vrm'];
            if (!extension) {
                return null;
            }
            const specVersion = extension.specVersion;
            if (!POSSIBLE_SPEC_VERSIONS$3.has(specVersion)) {
                console.warn(`VRMFirstPersonLoaderPlugin: Unknown VRMC_vrm specVersion "${specVersion}"`);
                return null;
            }
            const schemaFirstPerson = extension.firstPerson;
            if (!schemaFirstPerson) {
                return null;
            }
            const meshAnnotations = [];
            const nodePrimitivesMap = yield gltfExtractPrimitivesFromNodes(gltf);
            Array.from(nodePrimitivesMap.entries()).forEach(([nodeIndex, primitives]) => {
                var _a;
                const annotation = schemaFirstPerson.meshAnnotations
                    ? schemaFirstPerson.meshAnnotations.find((a) => a.node === nodeIndex)
                    : undefined;
                meshAnnotations.push({
                    meshes: primitives,
                    type: (_a = annotation === null || annotation === void 0 ? void 0 : annotation.type) !== null && _a !== void 0 ? _a : 'both',
                });
            });
            return new VRMFirstPerson(humanoid, meshAnnotations);
        });
    }
    _v0Import(gltf, humanoid) {
        var _a;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const vrmExt = (_a = json.extensions) === null || _a === void 0 ? void 0 : _a.VRM;
            if (!vrmExt) {
                return null;
            }
            const schemaFirstPerson = vrmExt.firstPerson;
            if (!schemaFirstPerson) {
                return null;
            }
            const meshAnnotations = [];
            const nodePrimitivesMap = yield gltfExtractPrimitivesFromNodes(gltf);
            Array.from(nodePrimitivesMap.entries()).forEach(([nodeIndex, primitives]) => {
                const schemaNode = json.nodes[nodeIndex];
                const flag = schemaFirstPerson.meshAnnotations
                    ? schemaFirstPerson.meshAnnotations.find((a) => a.mesh === schemaNode.mesh)
                    : undefined;
                meshAnnotations.push({
                    meshes: primitives,
                    type: this._convertV0FlagToV1Type(flag === null || flag === void 0 ? void 0 : flag.firstPersonFlag),
                });
            });
            return new VRMFirstPerson(humanoid, meshAnnotations);
        });
    }
    _convertV0FlagToV1Type(flag) {
        if (flag === 'FirstPersonOnly') {
            return 'firstPersonOnly';
        }
        else if (flag === 'ThirdPersonOnly') {
            return 'thirdPersonOnly';
        }
        else if (flag === 'Auto') {
            return 'auto';
        }
        else {
            return 'both';
        }
    }
}


const VRMFirstPersonMeshAnnotationType = {
    Auto: 'auto',
    Both: 'both',
    ThirdPersonOnly: 'thirdPersonOnly',
    FirstPersonOnly: 'firstPersonOnly',
};

const _v3A$4$1 = new THREE.Vector3();
const _v3B$2$1 = new THREE.Vector3();
const _quatA$5 = new THREE.Quaternion();
class VRMHumanoidHelper extends THREE.Group {
    constructor(humanoid) {
        super();
        this.vrmHumanoid = humanoid;
        this._boneAxesMap = new Map();
        Object.values(humanoid.humanBones).forEach((bone) => {
            const helper = new THREE.AxesHelper(1.0);
            helper.matrixAutoUpdate = false;
            helper.material.depthTest = false;
            helper.material.depthWrite = false;
            this.add(helper);
            this._boneAxesMap.set(bone, helper);
        });
    }
    dispose() {
        Array.from(this._boneAxesMap.values()).forEach((axes) => {
            axes.geometry.dispose();
            axes.material.dispose();
        });
    }
    updateMatrixWorld(force) {
        Array.from(this._boneAxesMap.entries()).forEach(([bone, axes]) => {
            bone.node.updateWorldMatrix(true, false);
            bone.node.matrixWorld.decompose(_v3A$4$1, _quatA$5, _v3B$2$1);
            const scale = _v3A$4$1.set(0.1, 0.1, 0.1).divide(_v3B$2$1);
            axes.matrix.copy(bone.node.matrixWorld).scale(scale);
        });
        super.updateMatrixWorld(force);
    }
}



const VRMHumanBoneList = [
    'hips',
    'spine',
    'chest',
    'upperChest',
    'neck',
    'head',
    'leftEye',
    'rightEye',
    'jaw',
    'leftUpperLeg',
    'leftLowerLeg',
    'leftFoot',
    'leftToes',
    'rightUpperLeg',
    'rightLowerLeg',
    'rightFoot',
    'rightToes',
    'leftShoulder',
    'leftUpperArm',
    'leftLowerArm',
    'leftHand',
    'rightShoulder',
    'rightUpperArm',
    'rightLowerArm',
    'rightHand',
    'leftThumbMetacarpal',
    'leftThumbProximal',
    'leftThumbDistal',
    'leftIndexProximal',
    'leftIndexIntermediate',
    'leftIndexDistal',
    'leftMiddleProximal',
    'leftMiddleIntermediate',
    'leftMiddleDistal',
    'leftRingProximal',
    'leftRingIntermediate',
    'leftRingDistal',
    'leftLittleProximal',
    'leftLittleIntermediate',
    'leftLittleDistal',
    'rightThumbMetacarpal',
    'rightThumbProximal',
    'rightThumbDistal',
    'rightIndexProximal',
    'rightIndexIntermediate',
    'rightIndexDistal',
    'rightMiddleProximal',
    'rightMiddleIntermediate',
    'rightMiddleDistal',
    'rightRingProximal',
    'rightRingIntermediate',
    'rightRingDistal',
    'rightLittleProximal',
    'rightLittleIntermediate',
    'rightLittleDistal',
];



const VRMHumanBoneName = {
    Hips: 'hips',
    Spine: 'spine',
    Chest: 'chest',
    UpperChest: 'upperChest',
    Neck: 'neck',
    Head: 'head',
    LeftEye: 'leftEye',
    RightEye: 'rightEye',
    Jaw: 'jaw',
    LeftUpperLeg: 'leftUpperLeg',
    LeftLowerLeg: 'leftLowerLeg',
    LeftFoot: 'leftFoot',
    LeftToes: 'leftToes',
    RightUpperLeg: 'rightUpperLeg',
    RightLowerLeg: 'rightLowerLeg',
    RightFoot: 'rightFoot',
    RightToes: 'rightToes',
    LeftShoulder: 'leftShoulder',
    LeftUpperArm: 'leftUpperArm',
    LeftLowerArm: 'leftLowerArm',
    LeftHand: 'leftHand',
    RightShoulder: 'rightShoulder',
    RightUpperArm: 'rightUpperArm',
    RightLowerArm: 'rightLowerArm',
    RightHand: 'rightHand',
    LeftThumbMetacarpal: 'leftThumbMetacarpal',
    LeftThumbProximal: 'leftThumbProximal',
    LeftThumbDistal: 'leftThumbDistal',
    LeftIndexProximal: 'leftIndexProximal',
    LeftIndexIntermediate: 'leftIndexIntermediate',
    LeftIndexDistal: 'leftIndexDistal',
    LeftMiddleProximal: 'leftMiddleProximal',
    LeftMiddleIntermediate: 'leftMiddleIntermediate',
    LeftMiddleDistal: 'leftMiddleDistal',
    LeftRingProximal: 'leftRingProximal',
    LeftRingIntermediate: 'leftRingIntermediate',
    LeftRingDistal: 'leftRingDistal',
    LeftLittleProximal: 'leftLittleProximal',
    LeftLittleIntermediate: 'leftLittleIntermediate',
    LeftLittleDistal: 'leftLittleDistal',
    RightThumbMetacarpal: 'rightThumbMetacarpal',
    RightThumbProximal: 'rightThumbProximal',
    RightThumbDistal: 'rightThumbDistal',
    RightIndexProximal: 'rightIndexProximal',
    RightIndexIntermediate: 'rightIndexIntermediate',
    RightIndexDistal: 'rightIndexDistal',
    RightMiddleProximal: 'rightMiddleProximal',
    RightMiddleIntermediate: 'rightMiddleIntermediate',
    RightMiddleDistal: 'rightMiddleDistal',
    RightRingProximal: 'rightRingProximal',
    RightRingIntermediate: 'rightRingIntermediate',
    RightRingDistal: 'rightRingDistal',
    RightLittleProximal: 'rightLittleProximal',
    RightLittleIntermediate: 'rightLittleIntermediate',
    RightLittleDistal: 'rightLittleDistal',
};



const VRMHumanBoneParentMap = {
    hips: null,
    spine: 'hips',
    chest: 'spine',
    upperChest: 'chest',
    neck: 'upperChest',
    head: 'neck',
    leftEye: 'head',
    rightEye: 'head',
    jaw: 'head',
    leftUpperLeg: 'hips',
    leftLowerLeg: 'leftUpperLeg',
    leftFoot: 'leftLowerLeg',
    leftToes: 'leftFoot',
    rightUpperLeg: 'hips',
    rightLowerLeg: 'rightUpperLeg',
    rightFoot: 'rightLowerLeg',
    rightToes: 'rightFoot',
    leftShoulder: 'upperChest',
    leftUpperArm: 'leftShoulder',
    leftLowerArm: 'leftUpperArm',
    leftHand: 'leftLowerArm',
    rightShoulder: 'upperChest',
    rightUpperArm: 'rightShoulder',
    rightLowerArm: 'rightUpperArm',
    rightHand: 'rightLowerArm',
    leftThumbMetacarpal: 'leftHand',
    leftThumbProximal: 'leftThumbMetacarpal',
    leftThumbDistal: 'leftThumbProximal',
    leftIndexProximal: 'leftHand',
    leftIndexIntermediate: 'leftIndexProximal',
    leftIndexDistal: 'leftIndexIntermediate',
    leftMiddleProximal: 'leftHand',
    leftMiddleIntermediate: 'leftMiddleProximal',
    leftMiddleDistal: 'leftMiddleIntermediate',
    leftRingProximal: 'leftHand',
    leftRingIntermediate: 'leftRingProximal',
    leftRingDistal: 'leftRingIntermediate',
    leftLittleProximal: 'leftHand',
    leftLittleIntermediate: 'leftLittleProximal',
    leftLittleDistal: 'leftLittleIntermediate',
    rightThumbMetacarpal: 'rightHand',
    rightThumbProximal: 'rightThumbMetacarpal',
    rightThumbDistal: 'rightThumbProximal',
    rightIndexProximal: 'rightHand',
    rightIndexIntermediate: 'rightIndexProximal',
    rightIndexDistal: 'rightIndexIntermediate',
    rightMiddleProximal: 'rightHand',
    rightMiddleIntermediate: 'rightMiddleProximal',
    rightMiddleDistal: 'rightMiddleIntermediate',
    rightRingProximal: 'rightHand',
    rightRingIntermediate: 'rightRingProximal',
    rightRingDistal: 'rightRingIntermediate',
    rightLittleProximal: 'rightHand',
    rightLittleIntermediate: 'rightLittleProximal',
    rightLittleDistal: 'rightLittleIntermediate',
};


function quatInvertCompat$1(target) {
    if (target.invert) {
        target.invert();
    }
    else {
        target.inverse();
    }
    return target;
}

const _v3A$3$2 = new THREE.Vector3();
const _quatA$4 = new THREE.Quaternion();

class VRMRig {
    
    constructor(humanBones) {
        this.humanBones = humanBones;
        this.restPose = this.getAbsolutePose();
    }
    
    getAbsolutePose() {
        const pose = {};
        Object.keys(this.humanBones).forEach((vrmBoneNameString) => {
            const vrmBoneName = vrmBoneNameString;
            const node = this.getBoneNode(vrmBoneName);
            if (!node) {
                return;
            }
            _v3A$3$2.copy(node.position);
            _quatA$4.copy(node.quaternion);
            pose[vrmBoneName] = {
                position: _v3A$3$2.toArray(),
                rotation: _quatA$4.toArray(),
            };
        });
        return pose;
    }
    
    getPose() {
        const pose = {};
        Object.keys(this.humanBones).forEach((boneNameString) => {
            const boneName = boneNameString;
            const node = this.getBoneNode(boneName);
            if (!node) {
                return;
            }
            _v3A$3$2.set(0, 0, 0);
            _quatA$4.identity();
            const restState = this.restPose[boneName];
            if (restState === null || restState === void 0 ? void 0 : restState.position) {
                _v3A$3$2.fromArray(restState.position).negate();
            }
            if (restState === null || restState === void 0 ? void 0 : restState.rotation) {
                quatInvertCompat$1(_quatA$4.fromArray(restState.rotation));
            }
            _v3A$3$2.add(node.position);
            _quatA$4.premultiply(node.quaternion);
            pose[boneName] = {
                position: _v3A$3$2.toArray(),
                rotation: _quatA$4.toArray(),
            };
        });
        return pose;
    }
    
    setPose(poseObject) {
        Object.entries(poseObject).forEach(([boneNameString, state]) => {
            const boneName = boneNameString;
            const node = this.getBoneNode(boneName);
            if (!node) {
                return;
            }
            const restState = this.restPose[boneName];
            if (!restState) {
                return;
            }
            if (state === null || state === void 0 ? void 0 : state.position) {
                node.position.fromArray(state.position);
                if (restState.position) {
                    node.position.add(_v3A$3$2.fromArray(restState.position));
                }
            }
            if (state === null || state === void 0 ? void 0 : state.rotation) {
                node.quaternion.fromArray(state.rotation);
                if (restState.rotation) {
                    node.quaternion.multiply(_quatA$4.fromArray(restState.rotation));
                }
            }
        });
    }
    
    resetPose() {
        Object.entries(this.restPose).forEach(([boneName, rest]) => {
            const node = this.getBoneNode(boneName);
            if (!node) {
                return;
            }
            if (rest === null || rest === void 0 ? void 0 : rest.position) {
                node.position.fromArray(rest.position);
            }
            if (rest === null || rest === void 0 ? void 0 : rest.rotation) {
                node.quaternion.fromArray(rest.rotation);
            }
        });
    }
    
    getBone(name) {
        var _a;
        return (_a = this.humanBones[name]) !== null && _a !== void 0 ? _a : undefined;
    }
    
    getBoneNode(name) {
        var _a, _b;
        return (_b = (_a = this.humanBones[name]) === null || _a === void 0 ? void 0 : _a.node) !== null && _b !== void 0 ? _b : null;
    }
}

const _v3A$2$2 = new THREE.Vector3();
const _quatA$3$1 = new THREE.Quaternion();
const _boneWorldPos = new THREE.Vector3();

class VRMHumanoidRig extends VRMRig {
    static _setupTransforms(modelRig) {
        const root = new THREE.Object3D();
        root.name = 'VRMHumanoidRig';
        const boneWorldPositions = {};
        const boneRotations = {};
        const parentWorldRotations = {};
        VRMHumanBoneList.forEach((boneName) => {
            var _a;
            const boneNode = modelRig.getBoneNode(boneName);
            if (boneNode) {
                const boneWorldPosition = new THREE.Vector3();
                const boneWorldRotation = new THREE.Quaternion();
                boneNode.updateWorldMatrix(true, false);
                boneNode.matrixWorld.decompose(boneWorldPosition, boneWorldRotation, _v3A$2$2);
                boneWorldPositions[boneName] = boneWorldPosition;
                boneRotations[boneName] = boneNode.quaternion.clone();
                const parentWorldRotation = new THREE.Quaternion();
                (_a = boneNode.parent) === null || _a === void 0 ? void 0 : _a.matrixWorld.decompose(_v3A$2$2, parentWorldRotation, _v3A$2$2);
                parentWorldRotations[boneName] = parentWorldRotation;
            }
        });
        const rigBones = {};
        VRMHumanBoneList.forEach((boneName) => {
            var _a;
            const boneNode = modelRig.getBoneNode(boneName);
            if (boneNode) {
                const boneWorldPosition = boneWorldPositions[boneName];
                let currentBoneName = boneName;
                let parentBoneWorldPosition;
                while (parentBoneWorldPosition == null) {
                    currentBoneName = VRMHumanBoneParentMap[currentBoneName];
                    if (currentBoneName == null) {
                        break;
                    }
                    parentBoneWorldPosition = boneWorldPositions[currentBoneName];
                }
                const rigBoneNode = new THREE.Object3D();
                rigBoneNode.name = 'Normalized_' + boneNode.name;
                const parentRigBoneNode = (currentBoneName ? (_a = rigBones[currentBoneName]) === null || _a === void 0 ? void 0 : _a.node : root);
                parentRigBoneNode.add(rigBoneNode);
                rigBoneNode.position.copy(boneWorldPosition);
                if (parentBoneWorldPosition) {
                    rigBoneNode.position.sub(parentBoneWorldPosition);
                }
                rigBones[boneName] = { node: rigBoneNode };
            }
        });
        return {
            rigBones: rigBones,
            root,
            parentWorldRotations,
            boneRotations,
        };
    }
    constructor(humanoid) {
        const { rigBones, root, parentWorldRotations, boneRotations } = VRMHumanoidRig._setupTransforms(humanoid);
        super(rigBones);
        this.original = humanoid;
        this.root = root;
        this._parentWorldRotations = parentWorldRotations;
        this._boneRotations = boneRotations;
    }
    
    update() {
        VRMHumanBoneList.forEach((boneName) => {
            const boneNode = this.original.getBoneNode(boneName);
            if (boneNode != null) {
                const rigBoneNode = this.getBoneNode(boneName);
                const parentWorldRotation = this._parentWorldRotations[boneName];
                const invParentWorldRotation = _quatA$3$1.copy(parentWorldRotation).invert();
                const boneRotation = this._boneRotations[boneName];
                boneNode.quaternion
                    .copy(rigBoneNode.quaternion)
                    .multiply(parentWorldRotation)
                    .premultiply(invParentWorldRotation)
                    .multiply(boneRotation);
                if (boneName === 'hips') {
                    const boneWorldPosition = rigBoneNode.getWorldPosition(_boneWorldPos);
                    boneNode.parent.updateWorldMatrix(true, false);
                    const parentWorldMatrix = boneNode.parent.matrixWorld;
                    const localPosition = boneWorldPosition.applyMatrix4(parentWorldMatrix.invert());
                    boneNode.position.copy(localPosition);
                }
            }
        });
    }
}


class VRMHumanoid {
    
    get restPose() {
        console.warn('VRMHumanoid: restPose is deprecated. Use either rawRestPose or normalizedRestPose instead.');
        return this.rawRestPose;
    }
    
    get rawRestPose() {
        return this._rawHumanBones.restPose;
    }
    
    get normalizedRestPose() {
        return this._normalizedHumanBones.restPose;
    }
    
    get humanBones() {
        return this._rawHumanBones.humanBones;
    }
    
    get rawHumanBones() {
        return this._rawHumanBones.humanBones;
    }
    
    get normalizedHumanBones() {
        return this._normalizedHumanBones.humanBones;
    }
    
    get normalizedHumanBonesRoot() {
        return this._normalizedHumanBones.root;
    }
    
    constructor(humanBones, options) {
        var _a;
        this.autoUpdateHumanBones = (_a = options === null || options === void 0 ? void 0 : options.autoUpdateHumanBones) !== null && _a !== void 0 ? _a : true;
        this._rawHumanBones = new VRMRig(humanBones);
        this._normalizedHumanBones = new VRMHumanoidRig(this._rawHumanBones);
    }
    
    copy(source) {
        this.autoUpdateHumanBones = source.autoUpdateHumanBones;
        this._rawHumanBones = new VRMRig(source.humanBones);
        this._normalizedHumanBones = new VRMHumanoidRig(this._rawHumanBones);
        return this;
    }
    
    clone() {
        return new VRMHumanoid(this.humanBones, { autoUpdateHumanBones: this.autoUpdateHumanBones }).copy(this);
    }
    
    getAbsolutePose() {
        console.warn('VRMHumanoid: getAbsolutePose() is deprecated. Use either getRawAbsolutePose() or getNormalizedAbsolutePose() instead.');
        return this.getRawAbsolutePose();
    }
    
    getRawAbsolutePose() {
        return this._rawHumanBones.getAbsolutePose();
    }
    
    getNormalizedAbsolutePose() {
        return this._normalizedHumanBones.getAbsolutePose();
    }
    
    getPose() {
        console.warn('VRMHumanoid: getPose() is deprecated. Use either getRawPose() or getNormalizedPose() instead.');
        return this.getRawPose();
    }
    
    getRawPose() {
        return this._rawHumanBones.getPose();
    }
    
    getNormalizedPose() {
        return this._normalizedHumanBones.getPose();
    }
    
    setPose(poseObject) {
        console.warn('VRMHumanoid: setPose() is deprecated. Use either setRawPose() or setNormalizedPose() instead.');
        return this.setRawPose(poseObject);
    }
    
    setRawPose(poseObject) {
        return this._rawHumanBones.setPose(poseObject);
    }
    
    setNormalizedPose(poseObject) {
        return this._normalizedHumanBones.setPose(poseObject);
    }
    
    resetPose() {
        console.warn('VRMHumanoid: resetPose() is deprecated. Use either resetRawPose() or resetNormalizedPose() instead.');
        return this.resetRawPose();
    }
    
    resetRawPose() {
        return this._rawHumanBones.resetPose();
    }
    
    resetNormalizedPose() {
        return this._normalizedHumanBones.resetPose();
    }
    
    getBone(name) {
        console.warn('VRMHumanoid: getBone() is deprecated. Use either getRawBone() or getNormalizedBone() instead.');
        return this.getRawBone(name);
    }
    
    getRawBone(name) {
        return this._rawHumanBones.getBone(name);
    }
    
    getNormalizedBone(name) {
        return this._normalizedHumanBones.getBone(name);
    }
    
    getBoneNode(name) {
        console.warn('VRMHumanoid: getBoneNode() is deprecated. Use either getRawBoneNode() or getNormalizedBoneNode() instead.');
        return this.getRawBoneNode(name);
    }
    
    getRawBoneNode(name) {
        return this._rawHumanBones.getBoneNode(name);
    }
    
    getNormalizedBoneNode(name) {
        return this._normalizedHumanBones.getBoneNode(name);
    }
    
    update() {
        if (this.autoUpdateHumanBones) {
            this._normalizedHumanBones.update();
        }
    }
}


const VRMRequiredHumanBoneName = {
    Hips: 'hips',
    Spine: 'spine',
    Head: 'head',
    LeftUpperLeg: 'leftUpperLeg',
    LeftLowerLeg: 'leftLowerLeg',
    LeftFoot: 'leftFoot',
    RightUpperLeg: 'rightUpperLeg',
    RightLowerLeg: 'rightLowerLeg',
    RightFoot: 'rightFoot',
    LeftUpperArm: 'leftUpperArm',
    LeftLowerArm: 'leftLowerArm',
    LeftHand: 'leftHand',
    RightUpperArm: 'rightUpperArm',
    RightLowerArm: 'rightLowerArm',
    RightHand: 'rightHand',
};


const POSSIBLE_SPEC_VERSIONS$2$1 = new Set(['1.0', '1.0-beta']);

const thumbBoneNameMap = {
    leftThumbProximal: 'leftThumbMetacarpal',
    leftThumbIntermediate: 'leftThumbProximal',
    rightThumbProximal: 'rightThumbMetacarpal',
    rightThumbIntermediate: 'rightThumbProximal',
};

class VRMHumanoidLoaderPlugin {
    get name() {
        return 'VRMHumanoidLoaderPlugin';
    }
    constructor(parser, options) {
        this.parser = parser;
        this.helperRoot = options === null || options === void 0 ? void 0 : options.helperRoot;
        this.autoUpdateHumanBones = options === null || options === void 0 ? void 0 : options.autoUpdateHumanBones;
    }
    afterRoot(gltf) {
        return __awaiter$6(this, void 0, void 0, function* () {
            gltf.userData.vrmHumanoid = yield this._import(gltf);
        });
    }
    
    _import(gltf) {
        return __awaiter$6(this, void 0, void 0, function* () {
            const v1Result = yield this._v1Import(gltf);
            if (v1Result) {
                return v1Result;
            }
            const v0Result = yield this._v0Import(gltf);
            if (v0Result) {
                return v0Result;
            }
            return null;
        });
    }
    _v1Import(gltf) {
        var _a, _b;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const isVRMUsed = ((_a = json.extensionsUsed) === null || _a === void 0 ? void 0 : _a.indexOf('VRMC_vrm')) !== -1;
            if (!isVRMUsed) {
                return null;
            }
            const extension = (_b = json.extensions) === null || _b === void 0 ? void 0 : _b['VRMC_vrm'];
            if (!extension) {
                return null;
            }
            const specVersion = extension.specVersion;
            if (!POSSIBLE_SPEC_VERSIONS$2$1.has(specVersion)) {
                console.warn(`VRMHumanoidLoaderPlugin: Unknown VRMC_vrm specVersion "${specVersion}"`);
                return null;
            }
            const schemaHumanoid = extension.humanoid;
            if (!schemaHumanoid) {
                return null;
            }
            
            const existsPreviousThumbName = schemaHumanoid.humanBones.leftThumbIntermediate != null ||
                schemaHumanoid.humanBones.rightThumbIntermediate != null;
            const humanBones = {};
            if (schemaHumanoid.humanBones != null) {
                yield Promise.all(Object.entries(schemaHumanoid.humanBones).map(([boneNameString, schemaHumanBone]) => __awaiter$6(this, void 0, void 0, function* () {
                    let boneName = boneNameString;
                    const index = schemaHumanBone.node;
                    if (existsPreviousThumbName) {
                        const thumbBoneName = thumbBoneNameMap[boneName];
                        if (thumbBoneName != null) {
                            boneName = thumbBoneName;
                        }
                    }
                    const node = yield this.parser.getDependency('node', index);
                    if (node == null) {
                        console.warn(`A glTF node bound to the humanoid bone ${boneName} (index = ${index}) does not exist`);
                        return;
                    }
                    humanBones[boneName] = { node };
                })));
            }
            const humanoid = new VRMHumanoid(this._ensureRequiredBonesExist(humanBones), {
                autoUpdateHumanBones: this.autoUpdateHumanBones,
            });
            gltf.scene.add(humanoid.normalizedHumanBonesRoot);
            if (this.helperRoot) {
                const helper = new VRMHumanoidHelper(humanoid);
                this.helperRoot.add(helper);
                helper.renderOrder = this.helperRoot.renderOrder;
            }
            return humanoid;
        });
    }
    _v0Import(gltf) {
        var _a;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const vrmExt = (_a = json.extensions) === null || _a === void 0 ? void 0 : _a.VRM;
            if (!vrmExt) {
                return null;
            }
            const schemaHumanoid = vrmExt.humanoid;
            if (!schemaHumanoid) {
                return null;
            }
            const humanBones = {};
            if (schemaHumanoid.humanBones != null) {
                yield Promise.all(schemaHumanoid.humanBones.map((bone) => __awaiter$6(this, void 0, void 0, function* () {
                    const boneName = bone.bone;
                    const index = bone.node;
                    if (boneName == null || index == null) {
                        return;
                    }
                    const node = yield this.parser.getDependency('node', index);
                    if (node == null) {
                        console.warn(`A glTF node bound to the humanoid bone ${boneName} (index = ${index}) does not exist`);
                        return;
                    }
                    const thumbBoneName = thumbBoneNameMap[boneName];
                    const newBoneName = (thumbBoneName !== null && thumbBoneName !== void 0 ? thumbBoneName : boneName);
                    if (humanBones[newBoneName] != null) {
                        console.warn(`Multiple bone entries for ${newBoneName} detected (index = ${index}), ignoring duplicated entries.`);
                        return;
                    }
                    humanBones[newBoneName] = { node };
                })));
            }
            const humanoid = new VRMHumanoid(this._ensureRequiredBonesExist(humanBones), {
                autoUpdateHumanBones: this.autoUpdateHumanBones,
            });
            gltf.scene.add(humanoid.normalizedHumanBonesRoot);
            if (this.helperRoot) {
                const helper = new VRMHumanoidHelper(humanoid);
                this.helperRoot.add(helper);
                helper.renderOrder = this.helperRoot.renderOrder;
            }
            return humanoid;
        });
    }
    
    _ensureRequiredBonesExist(humanBones) {
        const missingRequiredBones = Object.values(VRMRequiredHumanBoneName).filter((requiredBoneName) => humanBones[requiredBoneName] == null);
        if (missingRequiredBones.length > 0) {
            throw new Error(`VRMHumanoidLoaderPlugin: These humanoid bones are required but not exist: ${missingRequiredBones.join(', ')}`);
        }
        return humanBones;
    }
}

class FanBufferGeometry extends THREE.BufferGeometry {
    constructor() {
        super();
        this._currentTheta = 0;
        this._currentRadius = 0;
        this.theta = 0.0;
        this.radius = 0.0;
        this._currentTheta = 0.0;
        this._currentRadius = 0.0;
        this._attrPos = new THREE.BufferAttribute(new Float32Array(65 * 3), 3);
        this.setAttribute('position', this._attrPos);
        this._attrIndex = new THREE.BufferAttribute(new Uint16Array(3 * 63), 1);
        this.setIndex(this._attrIndex);
        this._buildIndex();
        this.update();
    }
    update() {
        let shouldUpdateGeometry = false;
        if (this._currentTheta !== this.theta) {
            this._currentTheta = this.theta;
            shouldUpdateGeometry = true;
        }
        if (this._currentRadius !== this.radius) {
            this._currentRadius = this.radius;
            shouldUpdateGeometry = true;
        }
        if (shouldUpdateGeometry) {
            this._buildPosition();
        }
    }
    _buildPosition() {
        this._attrPos.setXYZ(0, 0.0, 0.0, 0.0);
        for (let i = 0; i < 64; i++) {
            const t = (i / 63.0) * this._currentTheta;
            this._attrPos.setXYZ(i + 1, this._currentRadius * Math.sin(t), 0.0, this._currentRadius * Math.cos(t));
        }
        this._attrPos.needsUpdate = true;
    }
    _buildIndex() {
        for (let i = 0; i < 63; i++) {
            this._attrIndex.setXYZ(i * 3, 0, i + 1, i + 2);
        }
        this._attrIndex.needsUpdate = true;
    }
}

class LineAndSphereBufferGeometry extends THREE.BufferGeometry {
    constructor() {
        super();
        this.radius = 0.0;
        this._currentRadius = 0.0;
        this.tail = new THREE.Vector3();
        this._currentTail = new THREE.Vector3();
        this._attrPos = new THREE.BufferAttribute(new Float32Array(294), 3);
        this.setAttribute('position', this._attrPos);
        this._attrIndex = new THREE.BufferAttribute(new Uint16Array(194), 1);
        this.setIndex(this._attrIndex);
        this._buildIndex();
        this.update();
    }
    update() {
        let shouldUpdateGeometry = false;
        if (this._currentRadius !== this.radius) {
            this._currentRadius = this.radius;
            shouldUpdateGeometry = true;
        }
        if (!this._currentTail.equals(this.tail)) {
            this._currentTail.copy(this.tail);
            shouldUpdateGeometry = true;
        }
        if (shouldUpdateGeometry) {
            this._buildPosition();
        }
    }
    _buildPosition() {
        for (let i = 0; i < 32; i++) {
            const t = (i / 16.0) * Math.PI;
            this._attrPos.setXYZ(i, Math.cos(t), Math.sin(t), 0.0);
            this._attrPos.setXYZ(32 + i, 0.0, Math.cos(t), Math.sin(t));
            this._attrPos.setXYZ(64 + i, Math.sin(t), 0.0, Math.cos(t));
        }
        this.scale(this._currentRadius, this._currentRadius, this._currentRadius);
        this.translate(this._currentTail.x, this._currentTail.y, this._currentTail.z);
        this._attrPos.setXYZ(96, 0, 0, 0);
        this._attrPos.setXYZ(97, this._currentTail.x, this._currentTail.y, this._currentTail.z);
        this._attrPos.needsUpdate = true;
    }
    _buildIndex() {
        for (let i = 0; i < 32; i++) {
            const i1 = (i + 1) % 32;
            this._attrIndex.setXY(i * 2, i, i1);
            this._attrIndex.setXY(64 + i * 2, 32 + i, 32 + i1);
            this._attrIndex.setXY(128 + i * 2, 64 + i, 64 + i1);
        }
        this._attrIndex.setXY(192, 96, 97);
        this._attrIndex.needsUpdate = true;
    }
}

const _quatA$2$1 = new THREE.Quaternion();
const _quatB$2$1 = new THREE.Quaternion();
const _v3A$1$2 = new THREE.Vector3();
const _v3B$1$2 = new THREE.Vector3();
const SQRT_2_OVER_2 = Math.sqrt(2.0) / 2.0;
const QUAT_XY_CW90 = new THREE.Quaternion(0, 0, -SQRT_2_OVER_2, SQRT_2_OVER_2);
const VEC3_POSITIVE_Y = new THREE.Vector3(0.0, 1.0, 0.0);
class VRMLookAtHelper extends THREE.Group {
    constructor(lookAt) {
        super();
        this.matrixAutoUpdate = false;
        this.vrmLookAt = lookAt;
        {
            const geometry = new FanBufferGeometry();
            geometry.radius = 0.5;
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
                depthTest: false,
                depthWrite: false,
            });
            this._meshPitch = new THREE.Mesh(geometry, material);
            this.add(this._meshPitch);
        }
        {
            const geometry = new FanBufferGeometry();
            geometry.radius = 0.5;
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
                depthTest: false,
                depthWrite: false,
            });
            this._meshYaw = new THREE.Mesh(geometry, material);
            this.add(this._meshYaw);
        }
        {
            const geometry = new LineAndSphereBufferGeometry();
            geometry.radius = 0.1;
            const material = new THREE.LineBasicMaterial({
                color: 0xffffff,
                depthTest: false,
                depthWrite: false,
            });
            this._lineTarget = new THREE.LineSegments(geometry, material);
            this._lineTarget.frustumCulled = false;
            this.add(this._lineTarget);
        }
    }
    dispose() {
        this._meshYaw.geometry.dispose();
        this._meshYaw.material.dispose();
        this._meshPitch.geometry.dispose();
        this._meshPitch.material.dispose();
        this._lineTarget.geometry.dispose();
        this._lineTarget.material.dispose();
    }
    updateMatrixWorld(force) {
        const yaw = THREE.MathUtils.DEG2RAD * this.vrmLookAt.yaw;
        this._meshYaw.geometry.theta = yaw;
        this._meshYaw.geometry.update();
        const pitch = THREE.MathUtils.DEG2RAD * this.vrmLookAt.pitch;
        this._meshPitch.geometry.theta = pitch;
        this._meshPitch.geometry.update();
        this.vrmLookAt.getLookAtWorldPosition(_v3A$1$2);
        this.vrmLookAt.getLookAtWorldQuaternion(_quatA$2$1);
        _quatA$2$1.multiply(this.vrmLookAt.getFaceFrontQuaternion(_quatB$2$1));
        this._meshYaw.position.copy(_v3A$1$2);
        this._meshYaw.quaternion.copy(_quatA$2$1);
        this._meshPitch.position.copy(_v3A$1$2);
        this._meshPitch.quaternion.copy(_quatA$2$1);
        this._meshPitch.quaternion.multiply(_quatB$2$1.setFromAxisAngle(VEC3_POSITIVE_Y, yaw));
        this._meshPitch.quaternion.multiply(QUAT_XY_CW90);
        const { target, autoUpdate } = this.vrmLookAt;
        if (target != null && autoUpdate) {
            target.getWorldPosition(_v3B$1$2).sub(_v3A$1$2);
            this._lineTarget.geometry.tail.copy(_v3B$1$2);
            this._lineTarget.geometry.update();
            this._lineTarget.position.copy(_v3A$1$2);
        }
        super.updateMatrixWorld(force);
    }
}

const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();

function getWorldQuaternionLite(object, out) {
    object.matrixWorld.decompose(_position, out, _scale);
    return out;
}


function calcAzimuthAltitude(vector) {
    return [Math.atan2(-vector.z, vector.x), Math.atan2(vector.y, Math.sqrt(vector.x * vector.x + vector.z * vector.z))];
}


function sanitizeAngle(angle) {
    const roundTurn = Math.round(angle / 2.0 / Math.PI);
    return angle - 2.0 * Math.PI * roundTurn;
}

const VEC3_POSITIVE_Z$1 = new THREE.Vector3(0.0, 0.0, 1.0);
const _v3A$6 = new THREE.Vector3();
const _v3B$3 = new THREE.Vector3();
const _v3C$2 = new THREE.Vector3();
const _quatA$1$1 = new THREE.Quaternion();
const _quatB$1$1 = new THREE.Quaternion();
const _quatC$1 = new THREE.Quaternion();
const _quatD = new THREE.Quaternion();
const _eulerA$1 = new THREE.Euler();

class VRMLookAt {
    
    get yaw() {
        return this._yaw;
    }
    
    set yaw(value) {
        this._yaw = value;
        this._needsUpdate = true;
    }
    
    get pitch() {
        return this._pitch;
    }
    
    set pitch(value) {
        this._pitch = value;
        this._needsUpdate = true;
    }
    
    get euler() {
        console.warn('VRMLookAt: euler is deprecated. use getEuler() instead.');
        return this.getEuler(new THREE.Euler());
    }
    
    constructor(humanoid, applier) {
        
        this.offsetFromHeadBone = new THREE.Vector3();
        
        this.autoUpdate = true;
        
        this.faceFront = new THREE.Vector3(0.0, 0.0, 1.0);
        this.humanoid = humanoid;
        this.applier = applier;
        this._yaw = 0.0;
        this._pitch = 0.0;
        this._needsUpdate = true;
        this._restHeadWorldQuaternion = this.getLookAtWorldQuaternion(new THREE.Quaternion());
    }
    
    getEuler(target) {
        return target.set(THREE.MathUtils.DEG2RAD * this._pitch, THREE.MathUtils.DEG2RAD * this._yaw, 0.0, 'YXZ');
    }
    
    copy(source) {
        if (this.humanoid !== source.humanoid) {
            throw new Error('VRMLookAt: humanoid must be same in order to copy');
        }
        this.offsetFromHeadBone.copy(source.offsetFromHeadBone);
        this.applier = source.applier;
        this.autoUpdate = source.autoUpdate;
        this.target = source.target;
        this.faceFront.copy(source.faceFront);
        return this;
    }
    
    clone() {
        return new VRMLookAt(this.humanoid, this.applier).copy(this);
    }
    
    reset() {
        this._yaw = 0.0;
        this._pitch = 0.0;
        this._needsUpdate = true;
    }
    
    getLookAtWorldPosition(target) {
        const head = this.humanoid.getRawBoneNode('head');
        return target.copy(this.offsetFromHeadBone).applyMatrix4(head.matrixWorld);
    }
    
    getLookAtWorldQuaternion(target) {
        const head = this.humanoid.getRawBoneNode('head');
        return getWorldQuaternionLite(head, target);
    }
    
    getFaceFrontQuaternion(target) {
        if (this.faceFront.distanceToSquared(VEC3_POSITIVE_Z$1) < 0.01) {
            return target.copy(this._restHeadWorldQuaternion).invert();
        }
        const [faceFrontAzimuth, faceFrontAltitude] = calcAzimuthAltitude(this.faceFront);
        _eulerA$1.set(0.0, 0.5 * Math.PI + faceFrontAzimuth, faceFrontAltitude, 'YZX');
        return target.setFromEuler(_eulerA$1).premultiply(_quatD.copy(this._restHeadWorldQuaternion).invert());
    }
    
    getLookAtWorldDirection(target) {
        this.getLookAtWorldQuaternion(_quatB$1$1);
        this.getFaceFrontQuaternion(_quatC$1);
        return target
            .copy(VEC3_POSITIVE_Z$1)
            .applyQuaternion(_quatB$1$1)
            .applyQuaternion(_quatC$1)
            .applyEuler(this.getEuler(_eulerA$1));
    }
    
    lookAt(position) {
        const headRotDiffInv = _quatA$1$1
            .copy(this._restHeadWorldQuaternion)
            .multiply(quatInvertCompat$1(this.getLookAtWorldQuaternion(_quatB$1$1)));
        const headPos = this.getLookAtWorldPosition(_v3B$3);
        const lookAtDir = _v3C$2.copy(position).sub(headPos).applyQuaternion(headRotDiffInv).normalize();
        const [azimuthFrom, altitudeFrom] = calcAzimuthAltitude(this.faceFront);
        const [azimuthTo, altitudeTo] = calcAzimuthAltitude(lookAtDir);
        const yaw = sanitizeAngle(azimuthTo - azimuthFrom);
        const pitch = sanitizeAngle(altitudeFrom - altitudeTo); // spinning (1, 0, 0) CCW around Z axis makes the vector look up, while spinning (0, 0, 1) CCW around X axis makes the vector look down
        this._yaw = THREE.MathUtils.RAD2DEG * yaw;
        this._pitch = THREE.MathUtils.RAD2DEG * pitch;
        this._needsUpdate = true;
    }
    
    update(delta) {
        if (this.target != null && this.autoUpdate) {
            this.lookAt(this.target.getWorldPosition(_v3A$6));
        }
        if (this._needsUpdate) {
            this._needsUpdate = false;
            this.applier.applyYawPitch(this._yaw, this._pitch);
        }
    }
}
VRMLookAt.EULER_ORDER = 'YXZ'; // yaw-pitch-roll

const VEC3_POSITIVE_Z = new THREE.Vector3(0.0, 0.0, 1.0);
const _quatA$6 = new THREE.Quaternion();
const _quatB$3 = new THREE.Quaternion();
const _eulerA = new THREE.Euler(0.0, 0.0, 0.0, 'YXZ');

class VRMLookAtBoneApplier {
    
    constructor(humanoid, rangeMapHorizontalInner, rangeMapHorizontalOuter, rangeMapVerticalDown, rangeMapVerticalUp) {
        this.humanoid = humanoid;
        this.rangeMapHorizontalInner = rangeMapHorizontalInner;
        this.rangeMapHorizontalOuter = rangeMapHorizontalOuter;
        this.rangeMapVerticalDown = rangeMapVerticalDown;
        this.rangeMapVerticalUp = rangeMapVerticalUp;
        this.faceFront = new THREE.Vector3(0.0, 0.0, 1.0);
        this._restQuatLeftEye = new THREE.Quaternion();
        this._restQuatRightEye = new THREE.Quaternion();
        this._restLeftEyeParentWorldQuat = new THREE.Quaternion();
        this._restRightEyeParentWorldQuat = new THREE.Quaternion();
        const leftEye = this.humanoid.getRawBoneNode('leftEye');
        const rightEye = this.humanoid.getRawBoneNode('rightEye');
        if (leftEye) {
            this._restQuatLeftEye.copy(leftEye.quaternion);
            getWorldQuaternionLite(leftEye.parent, this._restLeftEyeParentWorldQuat);
        }
        if (rightEye) {
            this._restQuatRightEye.copy(rightEye.quaternion);
            getWorldQuaternionLite(rightEye.parent, this._restRightEyeParentWorldQuat);
        }
    }
    
    applyYawPitch(yaw, pitch) {
        const leftEye = this.humanoid.getRawBoneNode('leftEye');
        const rightEye = this.humanoid.getRawBoneNode('rightEye');
        const leftEyeNormalized = this.humanoid.getNormalizedBoneNode('leftEye');
        const rightEyeNormalized = this.humanoid.getNormalizedBoneNode('rightEye');
        if (leftEye) {
            if (pitch < 0.0) {
                _eulerA.x = -THREE.MathUtils.DEG2RAD * this.rangeMapVerticalDown.map(-pitch);
            }
            else {
                _eulerA.x = THREE.MathUtils.DEG2RAD * this.rangeMapVerticalUp.map(pitch);
            }
            if (yaw < 0.0) {
                _eulerA.y = -THREE.MathUtils.DEG2RAD * this.rangeMapHorizontalInner.map(-yaw);
            }
            else {
                _eulerA.y = THREE.MathUtils.DEG2RAD * this.rangeMapHorizontalOuter.map(yaw);
            }
            _quatA$6.setFromEuler(_eulerA);
            this._getWorldFaceFrontQuat(_quatB$3);
            leftEyeNormalized.quaternion.copy(_quatB$3).multiply(_quatA$6).multiply(_quatB$3.invert());
            _quatA$6.copy(this._restLeftEyeParentWorldQuat);
            leftEye.quaternion
                .copy(leftEyeNormalized.quaternion)
                .multiply(_quatA$6)
                .premultiply(_quatA$6.invert())
                .multiply(this._restQuatLeftEye);
        }
        if (rightEye) {
            if (pitch < 0.0) {
                _eulerA.x = -THREE.MathUtils.DEG2RAD * this.rangeMapVerticalDown.map(-pitch);
            }
            else {
                _eulerA.x = THREE.MathUtils.DEG2RAD * this.rangeMapVerticalUp.map(pitch);
            }
            if (yaw < 0.0) {
                _eulerA.y = -THREE.MathUtils.DEG2RAD * this.rangeMapHorizontalOuter.map(-yaw);
            }
            else {
                _eulerA.y = THREE.MathUtils.DEG2RAD * this.rangeMapHorizontalInner.map(yaw);
            }
            _quatA$6.setFromEuler(_eulerA);
            this._getWorldFaceFrontQuat(_quatB$3);
            rightEyeNormalized.quaternion.copy(_quatB$3).multiply(_quatA$6).multiply(_quatB$3.invert());
            _quatA$6.copy(this._restRightEyeParentWorldQuat);
            rightEye.quaternion
                .copy(rightEyeNormalized.quaternion)
                .multiply(_quatA$6)
                .premultiply(_quatA$6.invert())
                .multiply(this._restQuatRightEye);
        }
    }
    
    lookAt(euler) {
        console.warn('VRMLookAtBoneApplier: lookAt() is deprecated. use apply() instead.');
        const yaw = THREE.MathUtils.RAD2DEG * euler.y;
        const pitch = THREE.MathUtils.RAD2DEG * euler.x;
        this.applyYawPitch(yaw, pitch);
    }
    
    _getWorldFaceFrontQuat(target) {
        if (this.faceFront.distanceToSquared(VEC3_POSITIVE_Z) < 0.01) {
            return target.identity();
        }
        const [faceFrontAzimuth, faceFrontAltitude] = calcAzimuthAltitude(this.faceFront);
        _eulerA.set(0.0, 0.5 * Math.PI + faceFrontAzimuth, faceFrontAltitude, 'YZX');
        return target.setFromEuler(_eulerA);
    }
}

VRMLookAtBoneApplier.type = 'bone';


class VRMLookAtExpressionApplier {
    
    constructor(expressions, rangeMapHorizontalInner, rangeMapHorizontalOuter, rangeMapVerticalDown, rangeMapVerticalUp) {
        this.expressions = expressions;
        this.rangeMapHorizontalInner = rangeMapHorizontalInner;
        this.rangeMapHorizontalOuter = rangeMapHorizontalOuter;
        this.rangeMapVerticalDown = rangeMapVerticalDown;
        this.rangeMapVerticalUp = rangeMapVerticalUp;
    }
    
    applyYawPitch(yaw, pitch) {
        if (pitch < 0.0) {
            this.expressions.setValue('lookDown', 0.0);
            this.expressions.setValue('lookUp', this.rangeMapVerticalUp.map(-pitch));
        }
        else {
            this.expressions.setValue('lookUp', 0.0);
            this.expressions.setValue('lookDown', this.rangeMapVerticalDown.map(pitch));
        }
        if (yaw < 0.0) {
            this.expressions.setValue('lookLeft', 0.0);
            this.expressions.setValue('lookRight', this.rangeMapHorizontalOuter.map(-yaw));
        }
        else {
            this.expressions.setValue('lookRight', 0.0);
            this.expressions.setValue('lookLeft', this.rangeMapHorizontalOuter.map(yaw));
        }
    }
    
    lookAt(euler) {
        console.warn('VRMLookAtBoneApplier: lookAt() is deprecated. use apply() instead.');
        const yaw = THREE.MathUtils.RAD2DEG * euler.y;
        const pitch = THREE.MathUtils.RAD2DEG * euler.x;
        this.applyYawPitch(yaw, pitch);
    }
}

VRMLookAtExpressionApplier.type = 'expression';

class VRMLookAtRangeMap {
    
    constructor(inputMaxValue, outputScale) {
        this.inputMaxValue = inputMaxValue;
        this.outputScale = outputScale;
    }
    
    map(src) {
        return this.outputScale * saturate(src / this.inputMaxValue);
    }
}


const POSSIBLE_SPEC_VERSIONS$1$1 = new Set(['1.0', '1.0-beta']);

const INPUT_MAX_VALUE_MINIMUM = 0.01;

class VRMLookAtLoaderPlugin {
    get name() {
        return 'VRMLookAtLoaderPlugin';
    }
    constructor(parser, options) {
        this.parser = parser;
        this.helperRoot = options === null || options === void 0 ? void 0 : options.helperRoot;
    }
    afterRoot(gltf) {
        return __awaiter$6(this, void 0, void 0, function* () {
            const vrmHumanoid = gltf.userData.vrmHumanoid;
            if (vrmHumanoid === null) {
                return;
            }
            else if (vrmHumanoid === undefined) {
                throw new Error('VRMLookAtLoaderPlugin: vrmHumanoid is undefined. VRMHumanoidLoaderPlugin have to be used first');
            }
            const vrmExpressionManager = gltf.userData.vrmExpressionManager;
            if (vrmExpressionManager === null) {
                return;
            }
            else if (vrmExpressionManager === undefined) {
                throw new Error('VRMLookAtLoaderPlugin: vrmExpressionManager is undefined. VRMExpressionLoaderPlugin have to be used first');
            }
            gltf.userData.vrmLookAt = yield this._import(gltf, vrmHumanoid, vrmExpressionManager);
        });
    }
    
    _import(gltf, humanoid, expressions) {
        return __awaiter$6(this, void 0, void 0, function* () {
            if (humanoid == null || expressions == null) {
                return null;
            }
            const v1Result = yield this._v1Import(gltf, humanoid, expressions);
            if (v1Result) {
                return v1Result;
            }
            const v0Result = yield this._v0Import(gltf, humanoid, expressions);
            if (v0Result) {
                return v0Result;
            }
            return null;
        });
    }
    _v1Import(gltf, humanoid, expressions) {
        var _a, _b, _c;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const isVRMUsed = ((_a = json.extensionsUsed) === null || _a === void 0 ? void 0 : _a.indexOf('VRMC_vrm')) !== -1;
            if (!isVRMUsed) {
                return null;
            }
            const extension = (_b = json.extensions) === null || _b === void 0 ? void 0 : _b['VRMC_vrm'];
            if (!extension) {
                return null;
            }
            const specVersion = extension.specVersion;
            if (!POSSIBLE_SPEC_VERSIONS$1$1.has(specVersion)) {
                console.warn(`VRMLookAtLoaderPlugin: Unknown VRMC_vrm specVersion "${specVersion}"`);
                return null;
            }
            const schemaLookAt = extension.lookAt;
            if (!schemaLookAt) {
                return null;
            }
            const defaultOutputScale = schemaLookAt.type === 'expression' ? 1.0 : 10.0;
            const mapHI = this._v1ImportRangeMap(schemaLookAt.rangeMapHorizontalInner, defaultOutputScale);
            const mapHO = this._v1ImportRangeMap(schemaLookAt.rangeMapHorizontalOuter, defaultOutputScale);
            const mapVD = this._v1ImportRangeMap(schemaLookAt.rangeMapVerticalDown, defaultOutputScale);
            const mapVU = this._v1ImportRangeMap(schemaLookAt.rangeMapVerticalUp, defaultOutputScale);
            let applier;
            if (schemaLookAt.type === 'expression') {
                applier = new VRMLookAtExpressionApplier(expressions, mapHI, mapHO, mapVD, mapVU);
            }
            else {
                applier = new VRMLookAtBoneApplier(humanoid, mapHI, mapHO, mapVD, mapVU);
            }
            const lookAt = this._importLookAt(humanoid, applier);
            lookAt.offsetFromHeadBone.fromArray((_c = schemaLookAt.offsetFromHeadBone) !== null && _c !== void 0 ? _c : [0.0, 0.06, 0.0]);
            return lookAt;
        });
    }
    _v1ImportRangeMap(schemaRangeMap, defaultOutputScale) {
        var _a, _b;
        let inputMaxValue = (_a = schemaRangeMap === null || schemaRangeMap === void 0 ? void 0 : schemaRangeMap.inputMaxValue) !== null && _a !== void 0 ? _a : 90.0;
        const outputScale = (_b = schemaRangeMap === null || schemaRangeMap === void 0 ? void 0 : schemaRangeMap.outputScale) !== null && _b !== void 0 ? _b : defaultOutputScale;
        if (inputMaxValue < INPUT_MAX_VALUE_MINIMUM) {
            console.warn('VRMLookAtLoaderPlugin: inputMaxValue of a range map is too small. Consider reviewing the range map!');
            inputMaxValue = INPUT_MAX_VALUE_MINIMUM;
        }
        return new VRMLookAtRangeMap(inputMaxValue, outputScale);
    }
    _v0Import(gltf, humanoid, expressions) {
        var _a, _b, _c, _d;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const vrmExt = (_a = json.extensions) === null || _a === void 0 ? void 0 : _a.VRM;
            if (!vrmExt) {
                return null;
            }
            const schemaFirstPerson = vrmExt.firstPerson;
            if (!schemaFirstPerson) {
                return null;
            }
            const defaultOutputScale = schemaFirstPerson.lookAtTypeName === 'BlendShape' ? 1.0 : 10.0;
            const mapHI = this._v0ImportDegreeMap(schemaFirstPerson.lookAtHorizontalInner, defaultOutputScale);
            const mapHO = this._v0ImportDegreeMap(schemaFirstPerson.lookAtHorizontalOuter, defaultOutputScale);
            const mapVD = this._v0ImportDegreeMap(schemaFirstPerson.lookAtVerticalDown, defaultOutputScale);
            const mapVU = this._v0ImportDegreeMap(schemaFirstPerson.lookAtVerticalUp, defaultOutputScale);
            let applier;
            if (schemaFirstPerson.lookAtTypeName === 'BlendShape') {
                applier = new VRMLookAtExpressionApplier(expressions, mapHI, mapHO, mapVD, mapVU);
            }
            else {
                applier = new VRMLookAtBoneApplier(humanoid, mapHI, mapHO, mapVD, mapVU);
            }
            const lookAt = this._importLookAt(humanoid, applier);
            if (schemaFirstPerson.firstPersonBoneOffset) {
                lookAt.offsetFromHeadBone.set((_b = schemaFirstPerson.firstPersonBoneOffset.x) !== null && _b !== void 0 ? _b : 0.0, (_c = schemaFirstPerson.firstPersonBoneOffset.y) !== null && _c !== void 0 ? _c : 0.06, -((_d = schemaFirstPerson.firstPersonBoneOffset.z) !== null && _d !== void 0 ? _d : 0.0));
            }
            else {
                lookAt.offsetFromHeadBone.set(0.0, 0.06, 0.0);
            }
            lookAt.faceFront.set(0.0, 0.0, -1.0);
            if (applier instanceof VRMLookAtBoneApplier) {
                applier.faceFront.set(0.0, 0.0, -1.0);
            }
            return lookAt;
        });
    }
    _v0ImportDegreeMap(schemaDegreeMap, defaultOutputScale) {
        var _a, _b;
        const curve = schemaDegreeMap === null || schemaDegreeMap === void 0 ? void 0 : schemaDegreeMap.curve;
        if (JSON.stringify(curve) !== '[0,0,0,1,1,1,1,0]') {
            console.warn('Curves of LookAtDegreeMap defined in VRM 0.0 are not supported');
        }
        let xRange = (_a = schemaDegreeMap === null || schemaDegreeMap === void 0 ? void 0 : schemaDegreeMap.xRange) !== null && _a !== void 0 ? _a : 90.0;
        const yRange = (_b = schemaDegreeMap === null || schemaDegreeMap === void 0 ? void 0 : schemaDegreeMap.yRange) !== null && _b !== void 0 ? _b : defaultOutputScale;
        if (xRange < INPUT_MAX_VALUE_MINIMUM) {
            console.warn('VRMLookAtLoaderPlugin: xRange of a degree map is too small. Consider reviewing the degree map!');
            xRange = INPUT_MAX_VALUE_MINIMUM;
        }
        return new VRMLookAtRangeMap(xRange, yRange);
    }
    _importLookAt(humanoid, applier) {
        const lookAt = new VRMLookAt(humanoid, applier);
        if (this.helperRoot) {
            const helper = new VRMLookAtHelper(lookAt);
            this.helperRoot.add(helper);
            helper.renderOrder = this.helperRoot.renderOrder;
        }
        return lookAt;
    }
}



const VRMLookAtTypeName = {
    Bone: 'bone',
    Expression: 'expression',
};


function resolveURL(url, path) {
    if (typeof url !== 'string' || url === '')
        return '';
    if (/^https?:\/\//i.test(path) && /^\//.test(url)) {
        path = path.replace(/(^https?:\/\/[^/]+).*/i, '$1');
    }
    if (/^(https?:)?\/\//i.test(url))
        return url;
    if (/^data:.*,.*$/i.test(url))
        return url;
    if (/^blob:.*$/i.test(url))
        return url;
    return path + url;
}


const POSSIBLE_SPEC_VERSIONS$5 = new Set(['1.0', '1.0-beta']);

class VRMMetaLoaderPlugin {
    get name() {
        return 'VRMMetaLoaderPlugin';
    }
    constructor(parser, options) {
        var _a, _b, _c;
        this.parser = parser;
        this.needThumbnailImage = (_a = options === null || options === void 0 ? void 0 : options.needThumbnailImage) !== null && _a !== void 0 ? _a : true;
        this.acceptLicenseUrls = (_b = options === null || options === void 0 ? void 0 : options.acceptLicenseUrls) !== null && _b !== void 0 ? _b : ['https://vrm.dev/licenses/1.0/'];
        this.acceptV0Meta = (_c = options === null || options === void 0 ? void 0 : options.acceptV0Meta) !== null && _c !== void 0 ? _c : true;
    }
    afterRoot(gltf) {
        return __awaiter$6(this, void 0, void 0, function* () {
            gltf.userData.vrmMeta = yield this._import(gltf);
        });
    }
    _import(gltf) {
        return __awaiter$6(this, void 0, void 0, function* () {
            const v1Result = yield this._v1Import(gltf);
            if (v1Result != null) {
                return v1Result;
            }
            const v0Result = yield this._v0Import(gltf);
            if (v0Result != null) {
                return v0Result;
            }
            return null;
        });
    }
    _v1Import(gltf) {
        var _a, _b, _c;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const isVRMUsed = ((_a = json.extensionsUsed) === null || _a === void 0 ? void 0 : _a.indexOf('VRMC_vrm')) !== -1;
            if (!isVRMUsed) {
                return null;
            }
            const extension = (_b = json.extensions) === null || _b === void 0 ? void 0 : _b['VRMC_vrm'];
            if (extension == null) {
                return null;
            }
            const specVersion = extension.specVersion;
            if (!POSSIBLE_SPEC_VERSIONS$5.has(specVersion)) {
                console.warn(`VRMMetaLoaderPlugin: Unknown VRMC_vrm specVersion "${specVersion}"`);
                return null;
            }
            const schemaMeta = extension.meta;
            if (!schemaMeta) {
                return null;
            }
            const licenseUrl = schemaMeta.licenseUrl;
            const acceptLicenseUrlsSet = new Set(this.acceptLicenseUrls);
            if (!acceptLicenseUrlsSet.has(licenseUrl)) {
                throw new Error(`VRMMetaLoaderPlugin: The license url "${licenseUrl}" is not accepted`);
            }
            let thumbnailImage = undefined;
            if (this.needThumbnailImage && schemaMeta.thumbnailImage != null) {
                thumbnailImage = (_c = (yield this._extractGLTFImage(schemaMeta.thumbnailImage))) !== null && _c !== void 0 ? _c : undefined;
            }
            return {
                metaVersion: '1',
                name: schemaMeta.name,
                version: schemaMeta.version,
                authors: schemaMeta.authors,
                copyrightInformation: schemaMeta.copyrightInformation,
                contactInformation: schemaMeta.contactInformation,
                references: schemaMeta.references,
                thirdPartyLicenses: schemaMeta.thirdPartyLicenses,
                thumbnailImage,
                licenseUrl: schemaMeta.licenseUrl,
                avatarPermission: schemaMeta.avatarPermission,
                allowExcessivelyViolentUsage: schemaMeta.allowExcessivelyViolentUsage,
                allowExcessivelySexualUsage: schemaMeta.allowExcessivelySexualUsage,
                commercialUsage: schemaMeta.commercialUsage,
                allowPoliticalOrReligiousUsage: schemaMeta.allowPoliticalOrReligiousUsage,
                allowAntisocialOrHateUsage: schemaMeta.allowAntisocialOrHateUsage,
                creditNotation: schemaMeta.creditNotation,
                allowRedistribution: schemaMeta.allowRedistribution,
                modification: schemaMeta.modification,
                otherLicenseUrl: schemaMeta.otherLicenseUrl,
            };
        });
    }
    _v0Import(gltf) {
        var _a;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const vrmExt = (_a = json.extensions) === null || _a === void 0 ? void 0 : _a.VRM;
            if (!vrmExt) {
                return null;
            }
            const schemaMeta = vrmExt.meta;
            if (!schemaMeta) {
                return null;
            }
            if (!this.acceptV0Meta) {
                throw new Error('VRMMetaLoaderPlugin: Attempted to load VRM0.0 meta but acceptV0Meta is false');
            }
            let texture;
            if (this.needThumbnailImage && schemaMeta.texture != null && schemaMeta.texture !== -1) {
                texture = yield this.parser.getDependency('texture', schemaMeta.texture);
            }
            return {
                metaVersion: '0',
                allowedUserName: schemaMeta.allowedUserName,
                author: schemaMeta.author,
                commercialUssageName: schemaMeta.commercialUssageName,
                contactInformation: schemaMeta.contactInformation,
                licenseName: schemaMeta.licenseName,
                otherLicenseUrl: schemaMeta.otherLicenseUrl,
                otherPermissionUrl: schemaMeta.otherPermissionUrl,
                reference: schemaMeta.reference,
                sexualUssageName: schemaMeta.sexualUssageName,
                texture: texture !== null && texture !== void 0 ? texture : undefined,
                title: schemaMeta.title,
                version: schemaMeta.version,
                violentUssageName: schemaMeta.violentUssageName,
            };
        });
    }
    _extractGLTFImage(index) {
        var _a;
        return __awaiter$6(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const source = (_a = json.images) === null || _a === void 0 ? void 0 : _a[index];
            if (source == null) {
                console.warn(`VRMMetaLoaderPlugin: Attempt to use images[${index}] of glTF as a thumbnail but the image doesn't exist`);
                return null;
            }
            let sourceURI = source.uri;
            if (source.bufferView != null) {
                const bufferView = yield this.parser.getDependency('bufferView', source.bufferView);
                const blob = new Blob([bufferView], { type: source.mimeType });
                sourceURI = URL.createObjectURL(blob);
            }
            if (sourceURI == null) {
                console.warn(`VRMMetaLoaderPlugin: Attempt to use images[${index}] of glTF as a thumbnail but the image couldn't load properly`);
                return null;
            }
            const loader = new THREE.ImageLoader();
            return yield loader.loadAsync(resolveURL(sourceURI, this.parser.options.path)).catch((error) => {
                console.error(error);
                console.warn('VRMMetaLoaderPlugin: Failed to load a thumbnail image');
                return null;
            });
        });
    }
}


class VRMCore {
    
    constructor(params) {
        this.scene = params.scene;
        this.meta = params.meta;
        this.humanoid = params.humanoid;
        this.expressionManager = params.expressionManager;
        this.firstPerson = params.firstPerson;
        this.lookAt = params.lookAt;
    }
    
    update(delta) {
        this.humanoid.update();
        if (this.lookAt) {
            this.lookAt.update(delta);
        }
        if (this.expressionManager) {
            this.expressionManager.update();
        }
    }
}

class VRMCoreLoaderPlugin {
    get name() {
        return 'VRMC_vrm';
    }
    constructor(parser, options) {
        var _a, _b, _c, _d, _e;
        this.parser = parser;
        const helperRoot = options === null || options === void 0 ? void 0 : options.helperRoot;
        const autoUpdateHumanBones = options === null || options === void 0 ? void 0 : options.autoUpdateHumanBones;
        this.expressionPlugin = (_a = options === null || options === void 0 ? void 0 : options.expressionPlugin) !== null && _a !== void 0 ? _a : new VRMExpressionLoaderPlugin(parser);
        this.firstPersonPlugin = (_b = options === null || options === void 0 ? void 0 : options.firstPersonPlugin) !== null && _b !== void 0 ? _b : new VRMFirstPersonLoaderPlugin(parser);
        this.humanoidPlugin =
            (_c = options === null || options === void 0 ? void 0 : options.humanoidPlugin) !== null && _c !== void 0 ? _c : new VRMHumanoidLoaderPlugin(parser, { helperRoot, autoUpdateHumanBones });
        this.lookAtPlugin = (_d = options === null || options === void 0 ? void 0 : options.lookAtPlugin) !== null && _d !== void 0 ? _d : new VRMLookAtLoaderPlugin(parser, { helperRoot });
        this.metaPlugin = (_e = options === null || options === void 0 ? void 0 : options.metaPlugin) !== null && _e !== void 0 ? _e : new VRMMetaLoaderPlugin(parser);
    }
    afterRoot(gltf) {
        return __awaiter$6(this, void 0, void 0, function* () {
            yield this.metaPlugin.afterRoot(gltf);
            yield this.humanoidPlugin.afterRoot(gltf);
            yield this.expressionPlugin.afterRoot(gltf);
            yield this.lookAtPlugin.afterRoot(gltf);
            yield this.firstPersonPlugin.afterRoot(gltf);
            const meta = gltf.userData.vrmMeta;
            const humanoid = gltf.userData.vrmHumanoid;
            if (meta && humanoid) {
                const vrmCore = new VRMCore({
                    scene: gltf.scene,
                    expressionManager: gltf.userData.vrmExpressionManager,
                    firstPerson: gltf.userData.vrmFirstPerson,
                    humanoid,
                    lookAt: gltf.userData.vrmLookAt,
                    meta,
                });
                gltf.userData.vrmCore = vrmCore;
            }
        });
    }
}


class VRM extends VRMCore {
    
    constructor(params) {
        super(params);
        this.materials = params.materials;
        this.springBoneManager = params.springBoneManager;
        this.nodeConstraintManager = params.nodeConstraintManager;
    }
    
    update(delta) {
        super.update(delta);
        if (this.nodeConstraintManager) {
            this.nodeConstraintManager.update();
        }
        if (this.springBoneManager) {
            this.springBoneManager.update(delta);
        }
        if (this.materials) {
            this.materials.forEach((material) => {
                if (material.update) {
                    material.update(delta);
                }
            });
        }
    }
}



function __awaiter$5(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};





function __awaiter$4(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var vertexShader = "// #define PHONG\n\nvarying vec3 vViewPosition;\n\n#ifndef FLAT_SHADED\n  varying vec3 vNormal;\n#endif\n\n#include <common>\n\n// #include <uv_pars_vertex>\n#ifdef MTOON_USE_UV\n  varying vec2 vUv;\n\n  // COMPAT: pre-r151 uses a common uvTransform\n  #if THREE_VRM_THREE_REVISION < 151\n    uniform mat3 uvTransform;\n  #endif\n#endif\n\n// #include <uv2_pars_vertex>\n// COMAPT: pre-r151 uses uv2 for lightMap and aoMap\n#if THREE_VRM_THREE_REVISION < 151\n  #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n    attribute vec2 uv2;\n    varying vec2 vUv2;\n    uniform mat3 uv2Transform;\n  #endif\n#endif\n\n// #include <displacementmap_pars_vertex>\n// #include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\n#ifdef USE_OUTLINEWIDTHMULTIPLYTEXTURE\n  uniform sampler2D outlineWidthMultiplyTexture;\n  uniform mat3 outlineWidthMultiplyTextureUvTransform;\n#endif\n\nuniform float outlineWidthFactor;\n\nvoid main() {\n\n  // #include <uv_vertex>\n  #ifdef MTOON_USE_UV\n    // COMPAT: pre-r151 uses a common uvTransform\n    #if THREE_VRM_THREE_REVISION >= 151\n      vUv = uv;\n    #else\n      vUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n    #endif\n  #endif\n\n  // #include <uv2_vertex>\n  // COMAPT: pre-r151 uses uv2 for lightMap and aoMap\n  #if THREE_VRM_THREE_REVISION < 151\n    #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n      vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;\n    #endif\n  #endif\n\n  #include <color_vertex>\n\n  #include <beginnormal_vertex>\n  #include <morphnormal_vertex>\n  #include <skinbase_vertex>\n  #include <skinnormal_vertex>\n\n  // we need this to compute the outline properly\n  objectNormal = normalize( objectNormal );\n\n  #include <defaultnormal_vertex>\n\n  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n    vNormal = normalize( transformedNormal );\n  #endif\n\n  #include <begin_vertex>\n\n  #include <morphtarget_vertex>\n  #include <skinning_vertex>\n  // #include <displacementmap_vertex>\n  #include <project_vertex>\n  #include <logdepthbuf_vertex>\n  #include <clipping_planes_vertex>\n\n  vViewPosition = - mvPosition.xyz;\n\n  float outlineTex = 1.0;\n\n  #ifdef OUTLINE\n    #ifdef USE_OUTLINEWIDTHMULTIPLYTEXTURE\n      vec2 outlineWidthMultiplyTextureUv = ( outlineWidthMultiplyTextureUvTransform * vec3( vUv, 1 ) ).xy;\n      outlineTex = texture2D( outlineWidthMultiplyTexture, outlineWidthMultiplyTextureUv ).g;\n    #endif\n\n    #ifdef OUTLINE_WIDTH_WORLD\n      float worldNormalLength = length( transformedNormal );\n      vec3 outlineOffset = outlineWidthFactor * outlineTex * worldNormalLength * objectNormal;\n      gl_Position = projectionMatrix * modelViewMatrix * vec4( outlineOffset + transformed, 1.0 );\n    #endif\n\n    #ifdef OUTLINE_WIDTH_SCREEN\n      vec3 clipNormal = ( projectionMatrix * modelViewMatrix * vec4( objectNormal, 0.0 ) ).xyz;\n      vec2 projectedNormal = normalize( clipNormal.xy );\n      projectedNormal.x *= projectionMatrix[ 0 ].x / projectionMatrix[ 1 ].y;\n      gl_Position.xy += 2.0 * outlineWidthFactor * outlineTex * projectedNormal.xy;\n    #endif\n\n    gl_Position.z += 1E-6 * gl_Position.w; // anti-artifact magic\n  #endif\n\n  #include <worldpos_vertex>\n  // #include <envmap_vertex>\n  #include <shadowmap_vertex>\n  #include <fog_vertex>\n\n}";

var fragmentShader = "// #define PHONG\n\nuniform vec3 litFactor;\n\nuniform float opacity;\n\nuniform vec3 shadeColorFactor;\n#ifdef USE_SHADEMULTIPLYTEXTURE\n  uniform sampler2D shadeMultiplyTexture;\n  uniform mat3 shadeMultiplyTextureUvTransform;\n#endif\n\nuniform float shadingShiftFactor;\nuniform float shadingToonyFactor;\n\n#ifdef USE_SHADINGSHIFTTEXTURE\n  uniform sampler2D shadingShiftTexture;\n  uniform mat3 shadingShiftTextureUvTransform;\n  uniform float shadingShiftTextureScale;\n#endif\n\nuniform float giEqualizationFactor;\n\nuniform vec3 parametricRimColorFactor;\n#ifdef USE_RIMMULTIPLYTEXTURE\n  uniform sampler2D rimMultiplyTexture;\n  uniform mat3 rimMultiplyTextureUvTransform;\n#endif\nuniform float rimLightingMixFactor;\nuniform float parametricRimFresnelPowerFactor;\nuniform float parametricRimLiftFactor;\n\n#ifdef USE_MATCAPTEXTURE\n  uniform vec3 matcapFactor;\n  uniform sampler2D matcapTexture;\n  uniform mat3 matcapTextureUvTransform;\n#endif\n\nuniform vec3 emissive;\nuniform float emissiveIntensity;\n\nuniform vec3 outlineColorFactor;\nuniform float outlineLightingMixFactor;\n\n#ifdef USE_UVANIMATIONMASKTEXTURE\n  uniform sampler2D uvAnimationMaskTexture;\n  uniform mat3 uvAnimationMaskTextureUvTransform;\n#endif\n\nuniform float uvAnimationScrollXOffset;\nuniform float uvAnimationScrollYOffset;\nuniform float uvAnimationRotationPhase;\n\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n\n// #include <uv_pars_fragment>\n#if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )\n  varying vec2 vUv;\n#endif\n\n// #include <uv2_pars_fragment>\n// COMAPT: pre-r151 uses uv2 for lightMap and aoMap\n#if THREE_VRM_THREE_REVISION < 151\n  #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n    varying vec2 vUv2;\n  #endif\n#endif\n\n#include <map_pars_fragment>\n\n#ifdef USE_MAP\n  uniform mat3 mapUvTransform;\n#endif\n\n// #include <alphamap_pars_fragment>\n\n#if THREE_VRM_THREE_REVISION >= 132\n  #include <alphatest_pars_fragment>\n#endif\n\n#include <aomap_pars_fragment>\n// #include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n\n#ifdef USE_EMISSIVEMAP\n  uniform mat3 emissiveMapUvTransform;\n#endif\n\n// #include <envmap_common_pars_fragment>\n// #include <envmap_pars_fragment>\n// #include <cube_uv_reflection_fragment>\n#include <fog_pars_fragment>\n\n// #include <bsdfs>\n// COMPAT: pre-r151 doesn't have BRDF_Lambert in <common>\n#if THREE_VRM_THREE_REVISION < 151\n  vec3 BRDF_Lambert( const in vec3 diffuseColor ) {\n    return RECIPROCAL_PI * diffuseColor;\n  }\n#endif\n\n#include <lights_pars_begin>\n\n#if THREE_VRM_THREE_REVISION >= 132\n  #include <normal_pars_fragment>\n#endif\n\n// #include <lights_phong_pars_fragment>\nvarying vec3 vViewPosition;\n\n#if THREE_VRM_THREE_REVISION < 132\n  #ifndef FLAT_SHADED\n    varying vec3 vNormal;\n  #endif\n#endif\n\nstruct MToonMaterial {\n  vec3 diffuseColor;\n  vec3 shadeColor;\n  float shadingShift;\n};\n\nfloat linearstep( float a, float b, float t ) {\n  return clamp( ( t - a ) / ( b - a ), 0.0, 1.0 );\n}\n\n\nfloat getShading(\n  const in float dotNL,\n  const in float shadow,\n  const in float shadingShift\n) {\n  float shading = dotNL;\n  shading = shading + shadingShift;\n  shading = linearstep( -1.0 + shadingToonyFactor, 1.0 - shadingToonyFactor, shading );\n  shading *= shadow;\n  return shading;\n}\n\n\nvec3 getDiffuse(\n  const in MToonMaterial material,\n  const in float shading,\n  in vec3 lightColor\n) {\n  #ifdef DEBUG_LITSHADERATE\n    return vec3( BRDF_Lambert( shading * lightColor ) );\n  #endif\n\n  #if THREE_VRM_THREE_REVISION < 132\n    #ifndef PHYSICALLY_CORRECT_LIGHTS\n      lightColor *= PI;\n    #endif\n  #endif\n\n  vec3 col = lightColor * BRDF_Lambert( mix( material.shadeColor, material.diffuseColor, shading ) );\n\n  // The \"comment out if you want to PBR absolutely\" line\n  #ifdef V0_COMPAT_SHADE\n    col = min( col, material.diffuseColor );\n  #endif\n\n  return col;\n}\n\n// COMPAT: pre-r156 uses a struct GeometricContext\n#if THREE_VRM_THREE_REVISION >= 157\n  void RE_Direct_MToon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in MToonMaterial material, const in float shadow, inout ReflectedLight reflectedLight ) {\n    float dotNL = clamp( dot( geometryNormal, directLight.direction ), -1.0, 1.0 );\n    vec3 irradiance = directLight.color;\n\n    // directSpecular will be used for rim lighting, not an actual specular\n    reflectedLight.directSpecular += irradiance;\n\n    irradiance *= dotNL;\n\n    float shading = getShading( dotNL, shadow, material.shadingShift );\n\n    // toon shaded diffuse\n    reflectedLight.directDiffuse += getDiffuse( material, shading, directLight.color );\n  }\n\n  void RE_IndirectDiffuse_MToon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in MToonMaterial material, inout ReflectedLight reflectedLight ) {\n    // indirect diffuse will use diffuseColor, no shadeColor involved\n    reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n\n    // directSpecular will be used for rim lighting, not an actual specular\n    reflectedLight.directSpecular += irradiance;\n  }\n#else\n  void RE_Direct_MToon( const in IncidentLight directLight, const in GeometricContext geometry, const in MToonMaterial material, const in float shadow, inout ReflectedLight reflectedLight ) {\n    float dotNL = clamp( dot( geometry.normal, directLight.direction ), -1.0, 1.0 );\n    vec3 irradiance = directLight.color;\n\n    #if THREE_VRM_THREE_REVISION < 132\n      #ifndef PHYSICALLY_CORRECT_LIGHTS\n        irradiance *= PI;\n      #endif\n    #endif\n\n    // directSpecular will be used for rim lighting, not an actual specular\n    reflectedLight.directSpecular += irradiance;\n\n    irradiance *= dotNL;\n\n    float shading = getShading( dotNL, shadow, material.shadingShift );\n\n    // toon shaded diffuse\n    reflectedLight.directDiffuse += getDiffuse( material, shading, directLight.color );\n  }\n\n  void RE_IndirectDiffuse_MToon( const in vec3 irradiance, const in GeometricContext geometry, const in MToonMaterial material, inout ReflectedLight reflectedLight ) {\n    // indirect diffuse will use diffuseColor, no shadeColor involved\n    reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n\n    // directSpecular will be used for rim lighting, not an actual specular\n    reflectedLight.directSpecular += irradiance;\n  }\n#endif\n\n#define RE_Direct RE_Direct_MToon\n#define RE_IndirectDiffuse RE_IndirectDiffuse_MToon\n#define Material_LightProbeLOD( material ) (0)\n\n#include <shadowmap_pars_fragment>\n// #include <bumpmap_pars_fragment>\n\n// #include <normalmap_pars_fragment>\n#ifdef USE_NORMALMAP\n\n  uniform sampler2D normalMap;\n  uniform mat3 normalMapUvTransform;\n  uniform vec2 normalScale;\n\n#endif\n\n// COMPAT: USE_NORMALMAP_OBJECTSPACE used to be OBJECTSPACE_NORMALMAP in pre-r151\n#if defined( USE_NORMALMAP_OBJECTSPACE ) || defined( OBJECTSPACE_NORMALMAP )\n\n  uniform mat3 normalMatrix;\n\n#endif\n\n// COMPAT: USE_NORMALMAP_TANGENTSPACE used to be TANGENTSPACE_NORMALMAP in pre-r151\n#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( TANGENTSPACE_NORMALMAP ) )\n\n  // Per-Pixel Tangent Space Normal Mapping\n  // http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html\n\n  // three-vrm specific change: it requires `uv` as an input in order to support uv scrolls\n\n  // Temporary compat against shader change @ Three.js r126, r151\n  #if THREE_VRM_THREE_REVISION >= 151\n\n    mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {\n\n      vec3 q0 = dFdx( eye_pos.xyz );\n      vec3 q1 = dFdy( eye_pos.xyz );\n      vec2 st0 = dFdx( uv.st );\n      vec2 st1 = dFdy( uv.st );\n\n      vec3 N = surf_norm;\n\n      vec3 q1perp = cross( q1, N );\n      vec3 q0perp = cross( N, q0 );\n\n      vec3 T = q1perp * st0.x + q0perp * st1.x;\n      vec3 B = q1perp * st0.y + q0perp * st1.y;\n\n      float det = max( dot( T, T ), dot( B, B ) );\n      float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );\n\n      return mat3( T * scale, B * scale, N );\n\n    }\n\n  #elif THREE_VRM_THREE_REVISION >= 126\n\n    vec3 perturbNormal2Arb( vec2 uv, vec3 eye_pos, vec3 surf_norm, vec3 mapN, float faceDirection ) {\n\n      vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );\n      vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );\n      vec2 st0 = dFdx( uv.st );\n      vec2 st1 = dFdy( uv.st );\n\n      vec3 N = normalize( surf_norm );\n\n      vec3 q1perp = cross( q1, N );\n      vec3 q0perp = cross( N, q0 );\n\n      vec3 T = q1perp * st0.x + q0perp * st1.x;\n      vec3 B = q1perp * st0.y + q0perp * st1.y;\n\n      // three-vrm specific change: Workaround for the issue that happens when delta of uv = 0.0\n      // TODO: Is this still required? Or shall I make a PR about it?\n      if ( length( T ) == 0.0 || length( B ) == 0.0 ) {\n        return surf_norm;\n      }\n\n      float det = max( dot( T, T ), dot( B, B ) );\n      float scale = ( det == 0.0 ) ? 0.0 : faceDirection * inversesqrt( det );\n\n      return normalize( T * ( mapN.x * scale ) + B * ( mapN.y * scale ) + N * mapN.z );\n\n    }\n\n  #else\n\n    vec3 perturbNormal2Arb( vec2 uv, vec3 eye_pos, vec3 surf_norm, vec3 mapN ) {\n\n      // Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988\n\n      vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );\n      vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );\n      vec2 st0 = dFdx( uv.st );\n      vec2 st1 = dFdy( uv.st );\n\n      float scale = sign( st1.t * st0.s - st0.t * st1.s ); // we do not care about the magnitude\n\n      vec3 S = ( q0 * st1.t - q1 * st0.t ) * scale;\n      vec3 T = ( - q0 * st1.s + q1 * st0.s ) * scale;\n\n      // three-vrm specific change: Workaround for the issue that happens when delta of uv = 0.0\n      // TODO: Is this still required? Or shall I make a PR about it?\n\n      if ( length( S ) == 0.0 || length( T ) == 0.0 ) {\n        return surf_norm;\n      }\n\n      S = normalize( S );\n      T = normalize( T );\n      vec3 N = normalize( surf_norm );\n\n      #ifdef DOUBLE_SIDED\n\n        // Workaround for Adreno GPUs gl_FrontFacing bug. See #15850 and #10331\n\n        bool frontFacing = dot( cross( S, T ), N ) > 0.0;\n\n        mapN.xy *= ( float( frontFacing ) * 2.0 - 1.0 );\n\n      #else\n\n        mapN.xy *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );\n\n      #endif\n\n      mat3 tsn = mat3( S, T, N );\n      return normalize( tsn * mapN );\n\n    }\n\n  #endif\n\n#endif\n\n// #include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\n// == post correction ==========================================================\nvoid postCorrection() {\n  #include <tonemapping_fragment>\n  #include <colorspace_fragment>\n  #include <fog_fragment>\n  #include <premultiplied_alpha_fragment>\n  #include <dithering_fragment>\n}\n\n// == main procedure ===========================================================\nvoid main() {\n  #include <clipping_planes_fragment>\n\n  vec2 uv = vec2(0.5, 0.5);\n\n  #if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )\n    uv = vUv;\n\n    float uvAnimMask = 1.0;\n    #ifdef USE_UVANIMATIONMASKTEXTURE\n      vec2 uvAnimationMaskTextureUv = ( uvAnimationMaskTextureUvTransform * vec3( uv, 1 ) ).xy;\n      uvAnimMask = texture2D( uvAnimationMaskTexture, uvAnimationMaskTextureUv ).b;\n    #endif\n\n    float uvRotCos = cos( uvAnimationRotationPhase * uvAnimMask );\n    float uvRotSin = sin( uvAnimationRotationPhase * uvAnimMask );\n    uv = mat2( uvRotCos, -uvRotSin, uvRotSin, uvRotCos ) * ( uv - 0.5 ) + 0.5;\n    uv = uv + vec2( uvAnimationScrollXOffset, uvAnimationScrollYOffset ) * uvAnimMask;\n  #endif\n\n  #ifdef DEBUG_UV\n    gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );\n    #if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )\n      gl_FragColor = vec4( uv, 0.0, 1.0 );\n    #endif\n    return;\n  #endif\n\n  vec4 diffuseColor = vec4( litFactor, opacity );\n  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n  vec3 totalEmissiveRadiance = emissive * emissiveIntensity;\n\n  #include <logdepthbuf_fragment>\n\n  // #include <map_fragment>\n  #ifdef USE_MAP\n    vec2 mapUv = ( mapUvTransform * vec3( uv, 1 ) ).xy;\n    vec4 sampledDiffuseColor = texture2D( map, mapUv );\n    #ifdef DECODE_VIDEO_TEXTURE\n      sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );\n    #endif\n    diffuseColor *= sampledDiffuseColor;\n  #endif\n\n  // #include <color_fragment>\n  #if ( defined( USE_COLOR ) && !defined( IGNORE_VERTEX_COLOR ) )\n    diffuseColor.rgb *= vColor;\n  #endif\n\n  // #include <alphamap_fragment>\n\n  #include <alphatest_fragment>\n\n  // #include <specularmap_fragment>\n\n  // #include <normal_fragment_begin>\n  float faceDirection = gl_FrontFacing ? 1.0 : -1.0;\n\n  #ifdef FLAT_SHADED\n\n    vec3 fdx = dFdx( vViewPosition );\n    vec3 fdy = dFdy( vViewPosition );\n    vec3 normal = normalize( cross( fdx, fdy ) );\n\n  #else\n\n    vec3 normal = normalize( vNormal );\n\n    #ifdef DOUBLE_SIDED\n\n      normal *= faceDirection;\n\n    #endif\n\n  #endif\n\n  #ifdef USE_NORMALMAP\n\n    vec2 normalMapUv = ( normalMapUvTransform * vec3( uv, 1 ) ).xy;\n\n  #endif\n\n  #ifdef USE_NORMALMAP_TANGENTSPACE\n\n    #ifdef USE_TANGENT\n\n      mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n\n    #else\n\n      mat3 tbn = getTangentFrame( - vViewPosition, normal, normalMapUv );\n\n    #endif\n\n    #if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )\n\n      tbn[0] *= faceDirection;\n      tbn[1] *= faceDirection;\n\n    #endif\n\n  #endif\n\n  #ifdef USE_CLEARCOAT_NORMALMAP\n\n    #ifdef USE_TANGENT\n\n      mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n\n    #else\n\n      mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );\n\n    #endif\n\n    #if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )\n\n      tbn2[0] *= faceDirection;\n      tbn2[1] *= faceDirection;\n\n    #endif\n\n  #endif\n\n  // non perturbed normal for clearcoat among others\n\n  vec3 nonPerturbedNormal = normal;\n\n  #ifdef OUTLINE\n    normal *= -1.0;\n  #endif\n\n  // #include <normal_fragment_maps>\n\n  // COMPAT: USE_NORMALMAP_OBJECTSPACE used to be OBJECTSPACE_NORMALMAP in pre-r151\n  #if defined( USE_NORMALMAP_OBJECTSPACE ) || defined( OBJECTSPACE_NORMALMAP )\n\n    normal = texture2D( normalMap, normalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals\n\n    #ifdef FLIP_SIDED\n\n      normal = - normal;\n\n    #endif\n\n    #ifdef DOUBLE_SIDED\n\n      // Temporary compat against shader change @ Three.js r126\n      // See: #21205, #21307, #21299\n      #if THREE_VRM_THREE_REVISION >= 126\n\n        normal = normal * faceDirection;\n\n      #else\n\n        normal = normal * ( float( gl_FrontFacing ) * 2.0 - 1.0 );\n\n      #endif\n\n    #endif\n\n    normal = normalize( normalMatrix * normal );\n\n  // COMPAT: USE_NORMALMAP_TANGENTSPACE used to be TANGENTSPACE_NORMALMAP in pre-r151\n  #elif defined( USE_NORMALMAP_TANGENTSPACE ) || defined( TANGENTSPACE_NORMALMAP )\n\n    vec3 mapN = texture2D( normalMap, normalMapUv ).xyz * 2.0 - 1.0;\n    mapN.xy *= normalScale;\n\n    // COMPAT: pre-r151\n    #if THREE_VRM_THREE_REVISION >= 151 || defined( USE_TANGENT )\n\n      normal = normalize( tbn * mapN );\n\n    #else\n\n      // pre-r126\n      #if THREE_VRM_THREE_REVISION >= 126\n\n        normal = perturbNormal2Arb( uv, -vViewPosition, normal, mapN, faceDirection );\n\n      #else\n\n        normal = perturbNormal2Arb( uv, -vViewPosition, normal, mapN );\n\n      #endif\n\n    #endif\n\n  #endif\n\n  // #include <emissivemap_fragment>\n  #ifdef USE_EMISSIVEMAP\n    vec2 emissiveMapUv = ( emissiveMapUvTransform * vec3( uv, 1 ) ).xy;\n    totalEmissiveRadiance *= texture2D( emissiveMap, emissiveMapUv ).rgb;\n  #endif\n\n  #ifdef DEBUG_NORMAL\n    gl_FragColor = vec4( 0.5 + 0.5 * normal, 1.0 );\n    return;\n  #endif\n\n  // -- MToon: lighting --------------------------------------------------------\n  // accumulation\n  // #include <lights_phong_fragment>\n  MToonMaterial material;\n\n  material.diffuseColor = diffuseColor.rgb;\n\n  material.shadeColor = shadeColorFactor;\n  #ifdef USE_SHADEMULTIPLYTEXTURE\n    vec2 shadeMultiplyTextureUv = ( shadeMultiplyTextureUvTransform * vec3( uv, 1 ) ).xy;\n    material.shadeColor *= texture2D( shadeMultiplyTexture, shadeMultiplyTextureUv ).rgb;\n  #endif\n\n  #if ( defined( USE_COLOR ) && !defined( IGNORE_VERTEX_COLOR ) )\n    material.shadeColor.rgb *= vColor;\n  #endif\n\n  material.shadingShift = shadingShiftFactor;\n  #ifdef USE_SHADINGSHIFTTEXTURE\n    vec2 shadingShiftTextureUv = ( shadingShiftTextureUvTransform * vec3( uv, 1 ) ).xy;\n    material.shadingShift += texture2D( shadingShiftTexture, shadingShiftTextureUv ).r * shadingShiftTextureScale;\n  #endif\n\n  // #include <lights_fragment_begin>\n\n  // MToon Specific changes:\n  // Since we want to take shadows into account of shading instead of irradiance,\n  // we had to modify the codes that multiplies the results of shadowmap into color of direct lights.\n\n  // COMPAT: pre-r156 uses a struct GeometricContext\n  #if THREE_VRM_THREE_REVISION >= 157\n    vec3 geometryPosition = - vViewPosition;\n    vec3 geometryNormal = normal;\n    vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );\n\n    vec3 geometryClearcoatNormal;\n\n    #ifdef USE_CLEARCOAT\n\n      geometryClearcoatNormal = clearcoatNormal;\n\n    #endif\n  #else\n    GeometricContext geometry;\n\n    geometry.position = - vViewPosition;\n    geometry.normal = normal;\n    geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );\n\n    #ifdef USE_CLEARCOAT\n\n      geometry.clearcoatNormal = clearcoatNormal;\n\n    #endif\n  #endif\n\n  IncidentLight directLight;\n\n  // since these variables will be used in unrolled loop, we have to define in prior\n  float shadow;\n\n  #if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\n\n    PointLight pointLight;\n    #if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0\n    PointLightShadow pointLightShadow;\n    #endif\n\n    #pragma unroll_loop_start\n    for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\n      pointLight = pointLights[ i ];\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        getPointLightInfo( pointLight, geometryPosition, directLight );\n      #elif THREE_VRM_THREE_REVISION >= 132\n        getPointLightInfo( pointLight, geometry, directLight );\n      #else\n        getPointDirectLightIrradiance( pointLight, geometry, directLight );\n      #endif\n\n      shadow = 1.0;\n      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )\n      pointLightShadow = pointLightShadows[ i ];\n      shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;\n      #endif\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );\n      #else\n        RE_Direct( directLight, geometry, material, shadow, reflectedLight );\n      #endif\n\n    }\n    #pragma unroll_loop_end\n\n  #endif\n\n  #if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\n\n    SpotLight spotLight;\n    #if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0\n    SpotLightShadow spotLightShadow;\n    #endif\n\n    #pragma unroll_loop_start\n    for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\n      spotLight = spotLights[ i ];\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        getSpotLightInfo( spotLight, geometryPosition, directLight );\n      #elif THREE_VRM_THREE_REVISION >= 132\n        getSpotLightInfo( spotLight, geometry, directLight );\n      #else\n        getSpotDirectLightIrradiance( spotLight, geometry, directLight );\n      #endif\n\n      shadow = 1.0;\n      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n      spotLightShadow = spotLightShadows[ i ];\n      shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;\n      #endif\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );\n      #else\n        RE_Direct( directLight, geometry, material, shadow, reflectedLight );\n      #endif\n\n    }\n    #pragma unroll_loop_end\n\n  #endif\n\n  #if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\n\n    DirectionalLight directionalLight;\n    #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0\n    DirectionalLightShadow directionalLightShadow;\n    #endif\n\n    #pragma unroll_loop_start\n    for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\n      directionalLight = directionalLights[ i ];\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        getDirectionalLightInfo( directionalLight, directLight );\n      #elif THREE_VRM_THREE_REVISION >= 132\n        getDirectionalLightInfo( directionalLight, geometry, directLight );\n      #else\n        getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );\n      #endif\n\n      shadow = 1.0;\n      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )\n      directionalLightShadow = directionalLightShadows[ i ];\n      shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n      #endif\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );\n      #else\n        RE_Direct( directLight, geometry, material, shadow, reflectedLight );\n      #endif\n\n    }\n    #pragma unroll_loop_end\n\n  #endif\n\n  // #if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )\n\n  //   RectAreaLight rectAreaLight;\n\n  //   #pragma unroll_loop_start\n  //   for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {\n\n  //     rectAreaLight = rectAreaLights[ i ];\n  //     RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );\n\n  //   }\n  //   #pragma unroll_loop_end\n\n  // #endif\n\n  #if defined( RE_IndirectDiffuse )\n\n    vec3 iblIrradiance = vec3( 0.0 );\n\n    vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n\n    // COMPAT: pre-r156 uses a struct GeometricContext\n    // COMPAT: pre-r156 doesn't have a define USE_LIGHT_PROBES\n    #if THREE_VRM_THREE_REVISION >= 157\n      #if defined( USE_LIGHT_PROBES )\n        irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );\n      #endif\n    #elif THREE_VRM_THREE_REVISION >= 133\n      irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );\n    #else\n      irradiance += getLightProbeIrradiance( lightProbe, geometry );\n    #endif\n\n    #if ( NUM_HEMI_LIGHTS > 0 )\n\n      #pragma unroll_loop_start\n      for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n\n        // COMPAT: pre-r156 uses a struct GeometricContext\n        #if THREE_VRM_THREE_REVISION >= 157\n          irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );\n        #elif THREE_VRM_THREE_REVISION >= 133\n          irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );\n        #else\n          irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );\n        #endif\n\n      }\n      #pragma unroll_loop_end\n\n    #endif\n\n  #endif\n\n  // #if defined( RE_IndirectSpecular )\n\n  //   vec3 radiance = vec3( 0.0 );\n  //   vec3 clearcoatRadiance = vec3( 0.0 );\n\n  // #endif\n\n  #include <lights_fragment_maps>\n  #include <lights_fragment_end>\n\n  // modulation\n  #include <aomap_fragment>\n\n  vec3 col = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;\n\n  #ifdef DEBUG_LITSHADERATE\n    gl_FragColor = vec4( col, diffuseColor.a );\n    postCorrection();\n    return;\n  #endif\n\n  // -- MToon: rim lighting -----------------------------------------\n  vec3 viewDir = normalize( vViewPosition );\n\n  #ifndef PHYSICALLY_CORRECT_LIGHTS\n    reflectedLight.directSpecular /= PI;\n  #endif\n  vec3 rimMix = mix( vec3( 1.0 ), reflectedLight.directSpecular, 1.0 );\n\n  vec3 rim = parametricRimColorFactor * pow( saturate( 1.0 - dot( viewDir, normal ) + parametricRimLiftFactor ), parametricRimFresnelPowerFactor );\n\n  #ifdef USE_MATCAPTEXTURE\n    {\n      vec3 x = normalize( vec3( viewDir.z, 0.0, -viewDir.x ) );\n      vec3 y = cross( viewDir, x ); // guaranteed to be normalized\n      vec2 sphereUv = 0.5 + 0.5 * vec2( dot( x, normal ), -dot( y, normal ) );\n      sphereUv = ( matcapTextureUvTransform * vec3( sphereUv, 1 ) ).xy;\n      vec3 matcap = texture2D( matcapTexture, sphereUv ).rgb;\n      rim += matcapFactor * matcap;\n    }\n  #endif\n\n  #ifdef USE_RIMMULTIPLYTEXTURE\n    vec2 rimMultiplyTextureUv = ( rimMultiplyTextureUvTransform * vec3( uv, 1 ) ).xy;\n    rim *= texture2D( rimMultiplyTexture, rimMultiplyTextureUv ).rgb;\n  #endif\n\n  col += rimMix * rim;\n\n  // -- MToon: Emission --------------------------------------------------------\n  col += totalEmissiveRadiance;\n\n  // #include <envmap_fragment>\n\n  // -- Almost done! -----------------------------------------------------------\n  #if defined( OUTLINE )\n    col = outlineColorFactor.rgb * mix( vec3( 1.0 ), col, outlineLightingMixFactor );\n  #endif\n\n  #ifdef OPAQUE\n    diffuseColor.a = 1.0;\n  #endif\n\n  gl_FragColor = vec4( col, diffuseColor.a );\n  postCorrection();\n}\n";



const MToonMaterialDebugMode = {
    
    None: 'none',
    
    Normal: 'normal',
    
    LitShadeRate: 'litShadeRate',
    
    UV: 'uv',
};


const MToonMaterialOutlineWidthMode = {
    None: 'none',
    WorldCoordinates: 'worldCoordinates',
    ScreenCoordinates: 'screenCoordinates',
};

const encodingColorSpaceMap = {
    3000: '',
    3001: 'srgb',
};

function getTextureColorSpace(texture) {
    if (parseInt(THREE.REVISION, 10) >= 152) {
        return texture.colorSpace;
    }
    else {
        return encodingColorSpaceMap[texture.encoding];
    }
}



class MToonMaterial extends THREE.ShaderMaterial {
    get color() {
        return this.uniforms.litFactor.value;
    }
    set color(value) {
        this.uniforms.litFactor.value = value;
    }
    get map() {
        return this.uniforms.map.value;
    }
    set map(value) {
        this.uniforms.map.value = value;
    }
    get normalMap() {
        return this.uniforms.normalMap.value;
    }
    set normalMap(value) {
        this.uniforms.normalMap.value = value;
    }
    get normalScale() {
        return this.uniforms.normalScale.value;
    }
    set normalScale(value) {
        this.uniforms.normalScale.value = value;
    }
    get emissive() {
        return this.uniforms.emissive.value;
    }
    set emissive(value) {
        this.uniforms.emissive.value = value;
    }
    get emissiveIntensity() {
        return this.uniforms.emissiveIntensity.value;
    }
    set emissiveIntensity(value) {
        this.uniforms.emissiveIntensity.value = value;
    }
    get emissiveMap() {
        return this.uniforms.emissiveMap.value;
    }
    set emissiveMap(value) {
        this.uniforms.emissiveMap.value = value;
    }
    get shadeColorFactor() {
        return this.uniforms.shadeColorFactor.value;
    }
    set shadeColorFactor(value) {
        this.uniforms.shadeColorFactor.value = value;
    }
    get shadeMultiplyTexture() {
        return this.uniforms.shadeMultiplyTexture.value;
    }
    set shadeMultiplyTexture(value) {
        this.uniforms.shadeMultiplyTexture.value = value;
    }
    get shadingShiftFactor() {
        return this.uniforms.shadingShiftFactor.value;
    }
    set shadingShiftFactor(value) {
        this.uniforms.shadingShiftFactor.value = value;
    }
    get shadingShiftTexture() {
        return this.uniforms.shadingShiftTexture.value;
    }
    set shadingShiftTexture(value) {
        this.uniforms.shadingShiftTexture.value = value;
    }
    get shadingShiftTextureScale() {
        return this.uniforms.shadingShiftTextureScale.value;
    }
    set shadingShiftTextureScale(value) {
        this.uniforms.shadingShiftTextureScale.value = value;
    }
    get shadingToonyFactor() {
        return this.uniforms.shadingToonyFactor.value;
    }
    set shadingToonyFactor(value) {
        this.uniforms.shadingToonyFactor.value = value;
    }
    get giEqualizationFactor() {
        return this.uniforms.giEqualizationFactor.value;
    }
    set giEqualizationFactor(value) {
        this.uniforms.giEqualizationFactor.value = value;
    }
    get matcapFactor() {
        return this.uniforms.matcapFactor.value;
    }
    set matcapFactor(value) {
        this.uniforms.matcapFactor.value = value;
    }
    get matcapTexture() {
        return this.uniforms.matcapTexture.value;
    }
    set matcapTexture(value) {
        this.uniforms.matcapTexture.value = value;
    }
    get parametricRimColorFactor() {
        return this.uniforms.parametricRimColorFactor.value;
    }
    set parametricRimColorFactor(value) {
        this.uniforms.parametricRimColorFactor.value = value;
    }
    get rimMultiplyTexture() {
        return this.uniforms.rimMultiplyTexture.value;
    }
    set rimMultiplyTexture(value) {
        this.uniforms.rimMultiplyTexture.value = value;
    }
    get rimLightingMixFactor() {
        return this.uniforms.rimLightingMixFactor.value;
    }
    set rimLightingMixFactor(value) {
        this.uniforms.rimLightingMixFactor.value = value;
    }
    get parametricRimFresnelPowerFactor() {
        return this.uniforms.parametricRimFresnelPowerFactor.value;
    }
    set parametricRimFresnelPowerFactor(value) {
        this.uniforms.parametricRimFresnelPowerFactor.value = value;
    }
    get parametricRimLiftFactor() {
        return this.uniforms.parametricRimLiftFactor.value;
    }
    set parametricRimLiftFactor(value) {
        this.uniforms.parametricRimLiftFactor.value = value;
    }
    get outlineWidthMultiplyTexture() {
        return this.uniforms.outlineWidthMultiplyTexture.value;
    }
    set outlineWidthMultiplyTexture(value) {
        this.uniforms.outlineWidthMultiplyTexture.value = value;
    }
    get outlineWidthFactor() {
        return this.uniforms.outlineWidthFactor.value;
    }
    set outlineWidthFactor(value) {
        this.uniforms.outlineWidthFactor.value = value;
    }
    get outlineColorFactor() {
        return this.uniforms.outlineColorFactor.value;
    }
    set outlineColorFactor(value) {
        this.uniforms.outlineColorFactor.value = value;
    }
    get outlineLightingMixFactor() {
        return this.uniforms.outlineLightingMixFactor.value;
    }
    set outlineLightingMixFactor(value) {
        this.uniforms.outlineLightingMixFactor.value = value;
    }
    get uvAnimationMaskTexture() {
        return this.uniforms.uvAnimationMaskTexture.value;
    }
    set uvAnimationMaskTexture(value) {
        this.uniforms.uvAnimationMaskTexture.value = value;
    }
    get uvAnimationScrollXOffset() {
        return this.uniforms.uvAnimationScrollXOffset.value;
    }
    set uvAnimationScrollXOffset(value) {
        this.uniforms.uvAnimationScrollXOffset.value = value;
    }
    get uvAnimationScrollYOffset() {
        return this.uniforms.uvAnimationScrollYOffset.value;
    }
    set uvAnimationScrollYOffset(value) {
        this.uniforms.uvAnimationScrollYOffset.value = value;
    }
    get uvAnimationRotationPhase() {
        return this.uniforms.uvAnimationRotationPhase.value;
    }
    set uvAnimationRotationPhase(value) {
        this.uniforms.uvAnimationRotationPhase.value = value;
    }
    
    get ignoreVertexColor() {
        return this._ignoreVertexColor;
    }
    set ignoreVertexColor(value) {
        this._ignoreVertexColor = value;
        this.needsUpdate = true;
    }
    
    get v0CompatShade() {
        return this._v0CompatShade;
    }
    
    set v0CompatShade(v) {
        this._v0CompatShade = v;
        this.needsUpdate = true;
    }
    
    get debugMode() {
        return this._debugMode;
    }
    
    set debugMode(m) {
        this._debugMode = m;
        this.needsUpdate = true;
    }
    get outlineWidthMode() {
        return this._outlineWidthMode;
    }
    set outlineWidthMode(m) {
        this._outlineWidthMode = m;
        this.needsUpdate = true;
    }
    get isOutline() {
        return this._isOutline;
    }
    set isOutline(b) {
        this._isOutline = b;
        this.needsUpdate = true;
    }
    
    get isMToonMaterial() {
        return true;
    }
    constructor(parameters = {}) {
        var _a;
        super({ vertexShader, fragmentShader });
        this.uvAnimationScrollXSpeedFactor = 0.0;
        this.uvAnimationScrollYSpeedFactor = 0.0;
        this.uvAnimationRotationSpeedFactor = 0.0;
        
        this.fog = true;
        
        this.normalMapType = THREE.TangentSpaceNormalMap;
        
        this._ignoreVertexColor = true;
        this._v0CompatShade = false;
        this._debugMode = MToonMaterialDebugMode.None;
        this._outlineWidthMode = MToonMaterialOutlineWidthMode.None;
        this._isOutline = false;
        if (parameters.transparentWithZWrite) {
            parameters.depthWrite = true;
        }
        delete parameters.transparentWithZWrite;
        parameters.fog = true;
        parameters.lights = true;
        parameters.clipping = true;
        if (parseInt(THREE.REVISION, 10) < 129) {
            parameters.skinning = parameters.skinning || false;
        }
        if (parseInt(THREE.REVISION, 10) < 131) {
            parameters.morphTargets = parameters.morphTargets || false;
            parameters.morphNormals = parameters.morphNormals || false;
        }
        this.uniforms = THREE.UniformsUtils.merge([
            THREE.UniformsLib.common,
            THREE.UniformsLib.normalmap,
            THREE.UniformsLib.emissivemap,
            THREE.UniformsLib.fog,
            THREE.UniformsLib.lights,
            {
                litFactor: { value: new THREE.Color(1.0, 1.0, 1.0) },
                mapUvTransform: { value: new THREE.Matrix3() },
                colorAlpha: { value: 1.0 },
                normalMapUvTransform: { value: new THREE.Matrix3() },
                shadeColorFactor: { value: new THREE.Color(0.0, 0.0, 0.0) },
                shadeMultiplyTexture: { value: null },
                shadeMultiplyTextureUvTransform: { value: new THREE.Matrix3() },
                shadingShiftFactor: { value: 0.0 },
                shadingShiftTexture: { value: null },
                shadingShiftTextureUvTransform: { value: new THREE.Matrix3() },
                shadingShiftTextureScale: { value: 1.0 },
                shadingToonyFactor: { value: 0.9 },
                giEqualizationFactor: { value: 0.9 },
                matcapFactor: { value: new THREE.Color(1.0, 1.0, 1.0) },
                matcapTexture: { value: null },
                matcapTextureUvTransform: { value: new THREE.Matrix3() },
                parametricRimColorFactor: { value: new THREE.Color(0.0, 0.0, 0.0) },
                rimMultiplyTexture: { value: null },
                rimMultiplyTextureUvTransform: { value: new THREE.Matrix3() },
                rimLightingMixFactor: { value: 1.0 },
                parametricRimFresnelPowerFactor: { value: 5.0 },
                parametricRimLiftFactor: { value: 0.0 },
                emissive: { value: new THREE.Color(0.0, 0.0, 0.0) },
                emissiveIntensity: { value: 1.0 },
                emissiveMapUvTransform: { value: new THREE.Matrix3() },
                outlineWidthMultiplyTexture: { value: null },
                outlineWidthMultiplyTextureUvTransform: { value: new THREE.Matrix3() },
                outlineWidthFactor: { value: 0.0 },
                outlineColorFactor: { value: new THREE.Color(0.0, 0.0, 0.0) },
                outlineLightingMixFactor: { value: 1.0 },
                uvAnimationMaskTexture: { value: null },
                uvAnimationMaskTextureUvTransform: { value: new THREE.Matrix3() },
                uvAnimationScrollXOffset: { value: 0.0 },
                uvAnimationScrollYOffset: { value: 0.0 },
                uvAnimationRotationPhase: { value: 0.0 },
            },
            (_a = parameters.uniforms) !== null && _a !== void 0 ? _a : {},
        ]);
        this.setValues(parameters);
        this._uploadUniformsWorkaround();
        this.customProgramCacheKey = () => [
            ...Object.entries(this._generateDefines()).map(([token, macro]) => `${token}:${macro}`),
            this.matcapTexture ? `matcapTextureColorSpace:${getTextureColorSpace(this.matcapTexture)}` : '',
            this.shadeMultiplyTexture
                ? `shadeMultiplyTextureColorSpace:${getTextureColorSpace(this.shadeMultiplyTexture)}`
                : '',
            this.rimMultiplyTexture ? `rimMultiplyTextureColorSpace:${getTextureColorSpace(this.rimMultiplyTexture)}` : '',
        ].join(',');
        this.onBeforeCompile = (shader) => {
            const threeRevision = parseInt(THREE.REVISION, 10);
            const defines = Object.entries(Object.assign(Object.assign({}, this._generateDefines()), this.defines))
                .filter(([token, macro]) => !!macro)
                .map(([token, macro]) => `#define ${token} ${macro}`)
                .join('\n') + '\n';
            shader.vertexShader = defines + shader.vertexShader;
            shader.fragmentShader = defines + shader.fragmentShader;
            if (threeRevision < 154) {
                shader.fragmentShader = shader.fragmentShader.replace('#include <colorspace_fragment>', '#include <encodings_fragment>');
            }
            if (threeRevision < 132) {
                shader.fragmentShader = shader.fragmentShader.replace('#include <normal_pars_fragment>', '');
                shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_pars_fragment>', '');
            }
        };
    }
    
    update(delta) {
        this._uploadUniformsWorkaround();
        this._updateUVAnimation(delta);
    }
    copy(source) {
        super.copy(source);
        this.map = source.map;
        this.normalMap = source.normalMap;
        this.emissiveMap = source.emissiveMap;
        this.shadeMultiplyTexture = source.shadeMultiplyTexture;
        this.shadingShiftTexture = source.shadingShiftTexture;
        this.matcapTexture = source.matcapTexture;
        this.rimMultiplyTexture = source.rimMultiplyTexture;
        this.outlineWidthMultiplyTexture = source.outlineWidthMultiplyTexture;
        this.uvAnimationMaskTexture = source.uvAnimationMaskTexture;
        this.normalMapType = source.normalMapType;
        this.uvAnimationScrollXSpeedFactor = source.uvAnimationScrollXSpeedFactor;
        this.uvAnimationScrollYSpeedFactor = source.uvAnimationScrollYSpeedFactor;
        this.uvAnimationRotationSpeedFactor = source.uvAnimationRotationSpeedFactor;
        this.ignoreVertexColor = source.ignoreVertexColor;
        this.v0CompatShade = source.v0CompatShade;
        this.debugMode = source.debugMode;
        this.outlineWidthMode = source.outlineWidthMode;
        this.isOutline = source.isOutline;
        this.needsUpdate = true;
        return this;
    }
    
    _updateUVAnimation(delta) {
        this.uniforms.uvAnimationScrollXOffset.value += delta * this.uvAnimationScrollXSpeedFactor;
        this.uniforms.uvAnimationScrollYOffset.value += delta * this.uvAnimationScrollYSpeedFactor;
        this.uniforms.uvAnimationRotationPhase.value += delta * this.uvAnimationRotationSpeedFactor;
        this.uniformsNeedUpdate = true;
    }
    
    _uploadUniformsWorkaround() {
        this.uniforms.opacity.value = this.opacity;
        this._updateTextureMatrix(this.uniforms.map, this.uniforms.mapUvTransform);
        this._updateTextureMatrix(this.uniforms.normalMap, this.uniforms.normalMapUvTransform);
        this._updateTextureMatrix(this.uniforms.emissiveMap, this.uniforms.emissiveMapUvTransform);
        this._updateTextureMatrix(this.uniforms.shadeMultiplyTexture, this.uniforms.shadeMultiplyTextureUvTransform);
        this._updateTextureMatrix(this.uniforms.shadingShiftTexture, this.uniforms.shadingShiftTextureUvTransform);
        this._updateTextureMatrix(this.uniforms.matcapTexture, this.uniforms.matcapTextureUvTransform);
        this._updateTextureMatrix(this.uniforms.rimMultiplyTexture, this.uniforms.rimMultiplyTextureUvTransform);
        this._updateTextureMatrix(this.uniforms.outlineWidthMultiplyTexture, this.uniforms.outlineWidthMultiplyTextureUvTransform);
        this._updateTextureMatrix(this.uniforms.uvAnimationMaskTexture, this.uniforms.uvAnimationMaskTextureUvTransform);
        const threeRevision = parseInt(THREE.REVISION, 10);
        if (threeRevision >= 132) {
            this.uniforms.alphaTest.value = this.alphaTest;
        }
        this.uniformsNeedUpdate = true;
    }
    
    _generateDefines() {
        const threeRevision = parseInt(THREE.REVISION, 10);
        const useUvInVert = this.outlineWidthMultiplyTexture !== null;
        const useUvInFrag = this.map !== null ||
            this.normalMap !== null ||
            this.emissiveMap !== null ||
            this.shadeMultiplyTexture !== null ||
            this.shadingShiftTexture !== null ||
            this.rimMultiplyTexture !== null ||
            this.uvAnimationMaskTexture !== null;
        return {
            THREE_VRM_THREE_REVISION: threeRevision,
            OUTLINE: this._isOutline,
            MTOON_USE_UV: useUvInVert || useUvInFrag,
            MTOON_UVS_VERTEX_ONLY: useUvInVert && !useUvInFrag,
            V0_COMPAT_SHADE: this._v0CompatShade,
            USE_SHADEMULTIPLYTEXTURE: this.shadeMultiplyTexture !== null,
            USE_SHADINGSHIFTTEXTURE: this.shadingShiftTexture !== null,
            USE_MATCAPTEXTURE: this.matcapTexture !== null,
            USE_RIMMULTIPLYTEXTURE: this.rimMultiplyTexture !== null,
            USE_OUTLINEWIDTHMULTIPLYTEXTURE: this._isOutline && this.outlineWidthMultiplyTexture !== null,
            USE_UVANIMATIONMASKTEXTURE: this.uvAnimationMaskTexture !== null,
            IGNORE_VERTEX_COLOR: this._ignoreVertexColor === true,
            DEBUG_NORMAL: this._debugMode === 'normal',
            DEBUG_LITSHADERATE: this._debugMode === 'litShadeRate',
            DEBUG_UV: this._debugMode === 'uv',
            OUTLINE_WIDTH_WORLD: this._isOutline && this._outlineWidthMode === MToonMaterialOutlineWidthMode.WorldCoordinates,
            OUTLINE_WIDTH_SCREEN: this._isOutline && this._outlineWidthMode === MToonMaterialOutlineWidthMode.ScreenCoordinates,
        };
    }
    _updateTextureMatrix(src, dst) {
        if (src.value) {
            if (src.value.matrixAutoUpdate) {
                src.value.updateMatrix();
            }
            dst.value.copy(src.value.matrix);
        }
    }
}

const colorSpaceEncodingMap = {
    '': 3000,
    srgb: 3001,
};

function setTextureColorSpace(texture, colorSpace) {
    if (parseInt(THREE.REVISION, 10) >= 152) {
        texture.colorSpace = colorSpace;
    }
    else {
        texture.encoding = colorSpaceEncodingMap[colorSpace];
    }
}


class GLTFMToonMaterialParamsAssignHelper {
    get pending() {
        return Promise.all(this._pendings);
    }
    constructor(parser, materialParams) {
        this._parser = parser;
        this._materialParams = materialParams;
        this._pendings = [];
    }
    assignPrimitive(key, value) {
        if (value != null) {
            this._materialParams[key] = value;
        }
    }
    assignColor(key, value, convertSRGBToLinear) {
        if (value != null) {
            this._materialParams[key] = new THREE.Color().fromArray(value);
            if (convertSRGBToLinear) {
                this._materialParams[key].convertSRGBToLinear();
            }
        }
    }
    assignTexture(key, texture, isColorTexture) {
        return __awaiter$4(this, void 0, void 0, function* () {
            const promise = (() => __awaiter$4(this, void 0, void 0, function* () {
                if (texture != null) {
                    yield this._parser.assignTexture(this._materialParams, key, texture);
                    if (isColorTexture) {
                        setTextureColorSpace(this._materialParams[key], 'srgb');
                    }
                }
            }))();
            this._pendings.push(promise);
            return promise;
        });
    }
    assignTextureByIndex(key, textureIndex, isColorTexture) {
        return __awaiter$4(this, void 0, void 0, function* () {
            return this.assignTexture(key, textureIndex != null ? { index: textureIndex } : undefined, isColorTexture);
        });
    }
}


const POSSIBLE_SPEC_VERSIONS$2 = new Set(['1.0', '1.0-beta']);
class MToonMaterialLoaderPlugin {
    get name() {
        return MToonMaterialLoaderPlugin.EXTENSION_NAME;
    }
    constructor(parser, options = {}) {
        var _a, _b, _c;
        this.parser = parser;
        this.renderOrderOffset = (_a = options.renderOrderOffset) !== null && _a !== void 0 ? _a : 0;
        this.v0CompatShade = (_b = options.v0CompatShade) !== null && _b !== void 0 ? _b : false;
        this.debugMode = (_c = options.debugMode) !== null && _c !== void 0 ? _c : 'none';
        this._mToonMaterialSet = new Set();
    }
    beforeRoot() {
        return __awaiter$4(this, void 0, void 0, function* () {
            this._removeUnlitExtensionIfMToonExists();
        });
    }
    afterRoot(gltf) {
        return __awaiter$4(this, void 0, void 0, function* () {
            gltf.userData.vrmMToonMaterials = Array.from(this._mToonMaterialSet);
        });
    }
    getMaterialType(materialIndex) {
        const v1Extension = this._getMToonExtension(materialIndex);
        if (v1Extension) {
            return MToonMaterial;
        }
        return null;
    }
    extendMaterialParams(materialIndex, materialParams) {
        const extension = this._getMToonExtension(materialIndex);
        if (extension) {
            return this._extendMaterialParams(extension, materialParams);
        }
        return null;
    }
    loadMesh(meshIndex) {
        var _a;
        return __awaiter$4(this, void 0, void 0, function* () {
            const parser = this.parser;
            const json = parser.json;
            const meshDef = (_a = json.meshes) === null || _a === void 0 ? void 0 : _a[meshIndex];
            if (meshDef == null) {
                throw new Error(`MToonMaterialLoaderPlugin: Attempt to use meshes[${meshIndex}] of glTF but the mesh doesn't exist`);
            }
            const primitivesDef = meshDef.primitives;
            const meshOrGroup = yield parser.loadMesh(meshIndex);
            if (primitivesDef.length === 1) {
                const mesh = meshOrGroup;
                const materialIndex = primitivesDef[0].material;
                if (materialIndex != null) {
                    this._setupPrimitive(mesh, materialIndex);
                }
            }
            else {
                const group = meshOrGroup;
                for (let i = 0; i < primitivesDef.length; i++) {
                    const mesh = group.children[i];
                    const materialIndex = primitivesDef[i].material;
                    if (materialIndex != null) {
                        this._setupPrimitive(mesh, materialIndex);
                    }
                }
            }
            return meshOrGroup;
        });
    }
    
    _removeUnlitExtensionIfMToonExists() {
        const parser = this.parser;
        const json = parser.json;
        const materialDefs = json.materials;
        materialDefs === null || materialDefs === void 0 ? void 0 : materialDefs.map((materialDef, iMaterial) => {
            var _a;
            const extension = this._getMToonExtension(iMaterial);
            if (extension && ((_a = materialDef.extensions) === null || _a === void 0 ? void 0 : _a['KHR_materials_unlit'])) {
                delete materialDef.extensions['KHR_materials_unlit'];
            }
        });
    }
    _getMToonExtension(materialIndex) {
        var _a, _b;
        const parser = this.parser;
        const json = parser.json;
        const materialDef = (_a = json.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
        if (materialDef == null) {
            console.warn(`MToonMaterialLoaderPlugin: Attempt to use materials[${materialIndex}] of glTF but the material doesn't exist`);
            return undefined;
        }
        const extension = (_b = materialDef.extensions) === null || _b === void 0 ? void 0 : _b[MToonMaterialLoaderPlugin.EXTENSION_NAME];
        if (extension == null) {
            return undefined;
        }
        const specVersion = extension.specVersion;
        if (!POSSIBLE_SPEC_VERSIONS$2.has(specVersion)) {
            console.warn(`MToonMaterialLoaderPlugin: Unknown ${MToonMaterialLoaderPlugin.EXTENSION_NAME} specVersion "${specVersion}"`);
            return undefined;
        }
        return extension;
    }
    _extendMaterialParams(extension, materialParams) {
        var _a;
        return __awaiter$4(this, void 0, void 0, function* () {
            delete materialParams.metalness;
            delete materialParams.roughness;
            const assignHelper = new GLTFMToonMaterialParamsAssignHelper(this.parser, materialParams);
            assignHelper.assignPrimitive('transparentWithZWrite', extension.transparentWithZWrite);
            assignHelper.assignColor('shadeColorFactor', extension.shadeColorFactor);
            assignHelper.assignTexture('shadeMultiplyTexture', extension.shadeMultiplyTexture, true);
            assignHelper.assignPrimitive('shadingShiftFactor', extension.shadingShiftFactor);
            assignHelper.assignTexture('shadingShiftTexture', extension.shadingShiftTexture, true);
            assignHelper.assignPrimitive('shadingShiftTextureScale', (_a = extension.shadingShiftTexture) === null || _a === void 0 ? void 0 : _a.scale);
            assignHelper.assignPrimitive('shadingToonyFactor', extension.shadingToonyFactor);
            assignHelper.assignPrimitive('giEqualizationFactor', extension.giEqualizationFactor);
            assignHelper.assignColor('matcapFactor', extension.matcapFactor);
            assignHelper.assignTexture('matcapTexture', extension.matcapTexture, true);
            assignHelper.assignColor('parametricRimColorFactor', extension.parametricRimColorFactor);
            assignHelper.assignTexture('rimMultiplyTexture', extension.rimMultiplyTexture, true);
            assignHelper.assignPrimitive('rimLightingMixFactor', extension.rimLightingMixFactor);
            assignHelper.assignPrimitive('parametricRimFresnelPowerFactor', extension.parametricRimFresnelPowerFactor);
            assignHelper.assignPrimitive('parametricRimLiftFactor', extension.parametricRimLiftFactor);
            assignHelper.assignPrimitive('outlineWidthMode', extension.outlineWidthMode);
            assignHelper.assignPrimitive('outlineWidthFactor', extension.outlineWidthFactor);
            assignHelper.assignTexture('outlineWidthMultiplyTexture', extension.outlineWidthMultiplyTexture, false);
            assignHelper.assignColor('outlineColorFactor', extension.outlineColorFactor);
            assignHelper.assignPrimitive('outlineLightingMixFactor', extension.outlineLightingMixFactor);
            assignHelper.assignTexture('uvAnimationMaskTexture', extension.uvAnimationMaskTexture, false);
            assignHelper.assignPrimitive('uvAnimationScrollXSpeedFactor', extension.uvAnimationScrollXSpeedFactor);
            assignHelper.assignPrimitive('uvAnimationScrollYSpeedFactor', extension.uvAnimationScrollYSpeedFactor);
            assignHelper.assignPrimitive('uvAnimationRotationSpeedFactor', extension.uvAnimationRotationSpeedFactor);
            assignHelper.assignPrimitive('v0CompatShade', this.v0CompatShade);
            assignHelper.assignPrimitive('debugMode', this.debugMode);
            yield assignHelper.pending;
        });
    }
    
    _setupPrimitive(mesh, materialIndex) {
        const extension = this._getMToonExtension(materialIndex);
        if (extension) {
            const renderOrder = this._parseRenderOrder(extension);
            mesh.renderOrder = renderOrder + this.renderOrderOffset;
            this._generateOutline(mesh);
            this._addToMaterialSet(mesh);
            return;
        }
    }
    
    _generateOutline(mesh) {
        const surfaceMaterial = mesh.material;
        if (!(surfaceMaterial instanceof MToonMaterial)) {
            return;
        }
        if (surfaceMaterial.outlineWidthMode === 'none' || surfaceMaterial.outlineWidthFactor <= 0.0) {
            return;
        }
        mesh.material = [surfaceMaterial]; // mesh.material is guaranteed to be a Material in GLTFLoader
        const outlineMaterial = surfaceMaterial.clone();
        outlineMaterial.name += ' (Outline)';
        outlineMaterial.isOutline = true;
        outlineMaterial.side = THREE.BackSide;
        mesh.material.push(outlineMaterial);
        const geometry = mesh.geometry; // mesh.geometry is guaranteed to be a BufferGeometry in GLTFLoader
        const primitiveVertices = geometry.index ? geometry.index.count : geometry.attributes.position.count / 3;
        geometry.addGroup(0, primitiveVertices, 0);
        geometry.addGroup(0, primitiveVertices, 1);
    }
    _addToMaterialSet(mesh) {
        const materialOrMaterials = mesh.material;
        const materialSet = new Set();
        if (Array.isArray(materialOrMaterials)) {
            materialOrMaterials.forEach((material) => materialSet.add(material));
        }
        else {
            materialSet.add(materialOrMaterials);
        }
        for (const material of materialSet) {
            if (material instanceof MToonMaterial) {
                this._mToonMaterialSet.add(material);
            }
        }
    }
    _parseRenderOrder(extension) {
        var _a;
        const enabledZWrite = extension.transparentWithZWrite;
        return (enabledZWrite ? 0 : 19) + ((_a = extension.renderQueueOffsetNumber) !== null && _a !== void 0 ? _a : 0);
    }
}
MToonMaterialLoaderPlugin.EXTENSION_NAME = 'VRMC_materials_mtoon';




function __awaiter$3(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class VRMMaterialsHDREmissiveMultiplierLoaderPlugin {
    get name() {
        return VRMMaterialsHDREmissiveMultiplierLoaderPlugin.EXTENSION_NAME;
    }
    constructor(parser) {
        this.parser = parser;
    }
    extendMaterialParams(materialIndex, materialParams) {
        return __awaiter$3(this, void 0, void 0, function* () {
            const extension = this._getHDREmissiveMultiplierExtension(materialIndex);
            if (extension == null) {
                return;
            }
            console.warn('VRMMaterialsHDREmissiveMultiplierLoaderPlugin: `VRMC_materials_hdr_emissiveMultiplier` is archived. Use `KHR_materials_emissive_strength` instead.');
            const emissiveMultiplier = extension.emissiveMultiplier;
            materialParams.emissiveIntensity = emissiveMultiplier;
        });
    }
    _getHDREmissiveMultiplierExtension(materialIndex) {
        var _a, _b;
        const parser = this.parser;
        const json = parser.json;
        const materialDef = (_a = json.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
        if (materialDef == null) {
            console.warn(`VRMMaterialsHDREmissiveMultiplierLoaderPlugin: Attempt to use materials[${materialIndex}] of glTF but the material doesn't exist`);
            return undefined;
        }
        const extension = (_b = materialDef.extensions) === null || _b === void 0 ? void 0 : _b[VRMMaterialsHDREmissiveMultiplierLoaderPlugin.EXTENSION_NAME];
        if (extension == null) {
            return undefined;
        }
        return extension;
    }
}
VRMMaterialsHDREmissiveMultiplierLoaderPlugin.EXTENSION_NAME = 'VRMC_materials_hdr_emissiveMultiplier';





function __awaiter$2(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function gammaEOTF(e) {
    return Math.pow(e, 2.2);
}

class VRMMaterialsV0CompatPlugin {
    get name() {
        return 'VRMMaterialsV0CompatPlugin';
    }
    constructor(parser) {
        var _a;
        this.parser = parser;
        this._renderQueueMapTransparent = new Map();
        this._renderQueueMapTransparentZWrite = new Map();
        const json = this.parser.json;
        json.extensionsUsed = (_a = json.extensionsUsed) !== null && _a !== void 0 ? _a : [];
        if (json.extensionsUsed.indexOf('KHR_texture_transform') === -1) {
            json.extensionsUsed.push('KHR_texture_transform');
        }
    }
    beforeRoot() {
        var _a;
        return __awaiter$2(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const v0VRMExtension = (_a = json.extensions) === null || _a === void 0 ? void 0 : _a['VRM'];
            const v0MaterialProperties = v0VRMExtension === null || v0VRMExtension === void 0 ? void 0 : v0VRMExtension.materialProperties;
            if (!v0MaterialProperties) {
                return;
            }
            this._populateRenderQueueMap(v0MaterialProperties);
            v0MaterialProperties.forEach((materialProperties, materialIndex) => {
                var _a, _b;
                const materialDef = (_a = json.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
                if (materialDef == null) {
                    console.warn(`VRMMaterialsV0CompatPlugin: Attempt to use materials[${materialIndex}] of glTF but the material doesn't exist`);
                    return;
                }
                if (materialProperties.shader === 'VRM/MToon') {
                    const material = this._parseV0MToonProperties(materialProperties, materialDef);
                    json.materials[materialIndex] = material;
                }
                else if ((_b = materialProperties.shader) === null || _b === void 0 ? void 0 : _b.startsWith('VRM/Unlit')) {
                    const material = this._parseV0UnlitProperties(materialProperties, materialDef);
                    json.materials[materialIndex] = material;
                }
                else if (materialProperties.shader === 'VRM_USE_GLTFSHADER') ;
                else {
                    console.warn(`VRMMaterialsV0CompatPlugin: Unknown shader: ${materialProperties.shader}`);
                }
            });
        });
    }
    _parseV0MToonProperties(materialProperties, schemaMaterial) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30;
        const isTransparent = (_b = (_a = materialProperties.keywordMap) === null || _a === void 0 ? void 0 : _a['_ALPHABLEND_ON']) !== null && _b !== void 0 ? _b : false;
        const enabledZWrite = ((_c = materialProperties.floatProperties) === null || _c === void 0 ? void 0 : _c['_ZWrite']) === 1;
        const transparentWithZWrite = enabledZWrite && isTransparent;
        const renderQueueOffsetNumber = this._v0ParseRenderQueue(materialProperties);
        const isCutoff = (_e = (_d = materialProperties.keywordMap) === null || _d === void 0 ? void 0 : _d['_ALPHATEST_ON']) !== null && _e !== void 0 ? _e : false;
        const alphaMode = isTransparent ? 'BLEND' : isCutoff ? 'MASK' : 'OPAQUE';
        const alphaCutoff = isCutoff ? (_g = (_f = materialProperties.floatProperties) === null || _f === void 0 ? void 0 : _f['_Cutoff']) !== null && _g !== void 0 ? _g : 0.5 : undefined;
        const cullMode = (_j = (_h = materialProperties.floatProperties) === null || _h === void 0 ? void 0 : _h['_CullMode']) !== null && _j !== void 0 ? _j : 2; // enum, { Off, Front, Back }
        const doubleSided = cullMode === 0;
        const textureTransformExt = this._portTextureTransform(materialProperties);
        const baseColorFactor = ((_l = (_k = materialProperties.vectorProperties) === null || _k === void 0 ? void 0 : _k['_Color']) !== null && _l !== void 0 ? _l : [1.0, 1.0, 1.0, 1.0]).map((v, i) => (i === 3 ? v : gammaEOTF(v)));
        const baseColorTextureIndex = (_m = materialProperties.textureProperties) === null || _m === void 0 ? void 0 : _m['_MainTex'];
        const baseColorTexture = baseColorTextureIndex != null
            ? {
                index: baseColorTextureIndex,
                extensions: Object.assign({}, textureTransformExt),
            }
            : undefined;
        const normalTextureScale = (_p = (_o = materialProperties.floatProperties) === null || _o === void 0 ? void 0 : _o['_BumpScale']) !== null && _p !== void 0 ? _p : 1.0;
        const normalTextureIndex = (_q = materialProperties.textureProperties) === null || _q === void 0 ? void 0 : _q['_BumpMap'];
        const normalTexture = normalTextureIndex != null
            ? {
                index: normalTextureIndex,
                scale: normalTextureScale,
                extensions: Object.assign({}, textureTransformExt),
            }
            : undefined;
        const emissiveFactor = ((_s = (_r = materialProperties.vectorProperties) === null || _r === void 0 ? void 0 : _r['_EmissionColor']) !== null && _s !== void 0 ? _s : [0.0, 0.0, 0.0, 1.0]).map(gammaEOTF);
        const emissiveTextureIndex = (_t = materialProperties.textureProperties) === null || _t === void 0 ? void 0 : _t['_EmissionMap'];
        const emissiveTexture = emissiveTextureIndex != null
            ? {
                index: emissiveTextureIndex,
                extensions: Object.assign({}, textureTransformExt),
            }
            : undefined;
        const shadeColorFactor = ((_v = (_u = materialProperties.vectorProperties) === null || _u === void 0 ? void 0 : _u['_ShadeColor']) !== null && _v !== void 0 ? _v : [0.97, 0.81, 0.86, 1.0]).map(gammaEOTF);
        const shadeMultiplyTextureIndex = (_w = materialProperties.textureProperties) === null || _w === void 0 ? void 0 : _w['_ShadeTexture'];
        const shadeMultiplyTexture = shadeMultiplyTextureIndex != null
            ? {
                index: shadeMultiplyTextureIndex,
                extensions: Object.assign({}, textureTransformExt),
            }
            : undefined;
        let shadingShiftFactor = (_y = (_x = materialProperties.floatProperties) === null || _x === void 0 ? void 0 : _x['_ShadeShift']) !== null && _y !== void 0 ? _y : 0.0;
        let shadingToonyFactor = (_0 = (_z = materialProperties.floatProperties) === null || _z === void 0 ? void 0 : _z['_ShadeToony']) !== null && _0 !== void 0 ? _0 : 0.9;
        shadingToonyFactor = THREE.MathUtils.lerp(shadingToonyFactor, 1.0, 0.5 + 0.5 * shadingShiftFactor);
        shadingShiftFactor = -shadingShiftFactor - (1.0 - shadingToonyFactor);
        const giIntensityFactor = (_2 = (_1 = materialProperties.floatProperties) === null || _1 === void 0 ? void 0 : _1['_IndirectLightIntensity']) !== null && _2 !== void 0 ? _2 : 0.1;
        const giEqualizationFactor = giIntensityFactor ? 1.0 - giIntensityFactor : undefined;
        const matcapTextureIndex = (_3 = materialProperties.textureProperties) === null || _3 === void 0 ? void 0 : _3['_SphereAdd'];
        const matcapFactor = matcapTextureIndex != null ? [1.0, 1.0, 1.0] : undefined;
        const matcapTexture = matcapTextureIndex != null
            ? {
                index: matcapTextureIndex,
            }
            : undefined;
        const rimLightingMixFactor = (_5 = (_4 = materialProperties.floatProperties) === null || _4 === void 0 ? void 0 : _4['_RimLightingMix']) !== null && _5 !== void 0 ? _5 : 0.0;
        const rimMultiplyTextureIndex = (_6 = materialProperties.textureProperties) === null || _6 === void 0 ? void 0 : _6['_RimTexture'];
        const rimMultiplyTexture = rimMultiplyTextureIndex != null
            ? {
                index: rimMultiplyTextureIndex,
                extensions: Object.assign({}, textureTransformExt),
            }
            : undefined;
        const parametricRimColorFactor = ((_8 = (_7 = materialProperties.vectorProperties) === null || _7 === void 0 ? void 0 : _7['_RimColor']) !== null && _8 !== void 0 ? _8 : [0.0, 0.0, 0.0, 1.0]).map(gammaEOTF);
        const parametricRimFresnelPowerFactor = (_10 = (_9 = materialProperties.floatProperties) === null || _9 === void 0 ? void 0 : _9['_RimFresnelPower']) !== null && _10 !== void 0 ? _10 : 1.0;
        const parametricRimLiftFactor = (_12 = (_11 = materialProperties.floatProperties) === null || _11 === void 0 ? void 0 : _11['_RimLift']) !== null && _12 !== void 0 ? _12 : 0.0;
        const outlineWidthMode = ['none', 'worldCoordinates', 'screenCoordinates'][(_14 = (_13 = materialProperties.floatProperties) === null || _13 === void 0 ? void 0 : _13['_OutlineWidthMode']) !== null && _14 !== void 0 ? _14 : 0];
        let outlineWidthFactor = (_16 = (_15 = materialProperties.floatProperties) === null || _15 === void 0 ? void 0 : _15['_OutlineWidth']) !== null && _16 !== void 0 ? _16 : 0.0;
        outlineWidthFactor = 0.01 * outlineWidthFactor;
        const outlineWidthMultiplyTextureIndex = (_17 = materialProperties.textureProperties) === null || _17 === void 0 ? void 0 : _17['_OutlineWidthTexture'];
        const outlineWidthMultiplyTexture = outlineWidthMultiplyTextureIndex != null
            ? {
                index: outlineWidthMultiplyTextureIndex,
                extensions: Object.assign({}, textureTransformExt),
            }
            : undefined;
        const outlineColorFactor = ((_19 = (_18 = materialProperties.vectorProperties) === null || _18 === void 0 ? void 0 : _18['_OutlineColor']) !== null && _19 !== void 0 ? _19 : [0.0, 0.0, 0.0]).map(gammaEOTF);
        const outlineColorMode = (_21 = (_20 = materialProperties.floatProperties) === null || _20 === void 0 ? void 0 : _20['_OutlineColorMode']) !== null && _21 !== void 0 ? _21 : 0; // enum, { Fixed, Mixed }
        const outlineLightingMixFactor = outlineColorMode === 1 ? (_23 = (_22 = materialProperties.floatProperties) === null || _22 === void 0 ? void 0 : _22['_OutlineLightingMix']) !== null && _23 !== void 0 ? _23 : 1.0 : 0.0;
        const uvAnimationMaskTextureIndex = (_24 = materialProperties.textureProperties) === null || _24 === void 0 ? void 0 : _24['_UvAnimMaskTexture'];
        const uvAnimationMaskTexture = uvAnimationMaskTextureIndex != null
            ? {
                index: uvAnimationMaskTextureIndex,
                extensions: Object.assign({}, textureTransformExt),
            }
            : undefined;
        const uvAnimationScrollXSpeedFactor = (_26 = (_25 = materialProperties.floatProperties) === null || _25 === void 0 ? void 0 : _25['_UvAnimScrollX']) !== null && _26 !== void 0 ? _26 : 0.0;
        let uvAnimationScrollYSpeedFactor = (_28 = (_27 = materialProperties.floatProperties) === null || _27 === void 0 ? void 0 : _27['_UvAnimScrollY']) !== null && _28 !== void 0 ? _28 : 0.0;
        if (uvAnimationScrollYSpeedFactor != null) {
            uvAnimationScrollYSpeedFactor = -uvAnimationScrollYSpeedFactor;
        }
        const uvAnimationRotationSpeedFactor = (_30 = (_29 = materialProperties.floatProperties) === null || _29 === void 0 ? void 0 : _29['_UvAnimRotation']) !== null && _30 !== void 0 ? _30 : 0.0;
        const mtoonExtension = {
            specVersion: '1.0',
            transparentWithZWrite,
            renderQueueOffsetNumber,
            shadeColorFactor,
            shadeMultiplyTexture,
            shadingShiftFactor,
            shadingToonyFactor,
            giEqualizationFactor,
            matcapFactor,
            matcapTexture,
            rimLightingMixFactor,
            rimMultiplyTexture,
            parametricRimColorFactor,
            parametricRimFresnelPowerFactor,
            parametricRimLiftFactor,
            outlineWidthMode,
            outlineWidthFactor,
            outlineWidthMultiplyTexture,
            outlineColorFactor,
            outlineLightingMixFactor,
            uvAnimationMaskTexture,
            uvAnimationScrollXSpeedFactor,
            uvAnimationScrollYSpeedFactor,
            uvAnimationRotationSpeedFactor,
        };
        return Object.assign(Object.assign({}, schemaMaterial), { pbrMetallicRoughness: {
                baseColorFactor,
                baseColorTexture,
            }, normalTexture,
            emissiveTexture,
            emissiveFactor,
            alphaMode,
            alphaCutoff,
            doubleSided, extensions: {
                VRMC_materials_mtoon: mtoonExtension,
            } });
    }
    _parseV0UnlitProperties(materialProperties, schemaMaterial) {
        var _a, _b, _c, _d, _e;
        const isTransparentZWrite = materialProperties.shader === 'VRM/UnlitTransparentZWrite';
        const isTransparent = materialProperties.shader === 'VRM/UnlitTransparent' || isTransparentZWrite;
        const renderQueueOffsetNumber = this._v0ParseRenderQueue(materialProperties);
        const isCutoff = materialProperties.shader === 'VRM/UnlitCutout';
        const alphaMode = isTransparent ? 'BLEND' : isCutoff ? 'MASK' : 'OPAQUE';
        const alphaCutoff = isCutoff ? (_b = (_a = materialProperties.floatProperties) === null || _a === void 0 ? void 0 : _a['_Cutoff']) !== null && _b !== void 0 ? _b : 0.5 : undefined;
        const textureTransformExt = this._portTextureTransform(materialProperties);
        const baseColorFactor = ((_d = (_c = materialProperties.vectorProperties) === null || _c === void 0 ? void 0 : _c['_Color']) !== null && _d !== void 0 ? _d : [1.0, 1.0, 1.0, 1.0]).map(gammaEOTF);
        const baseColorTextureIndex = (_e = materialProperties.textureProperties) === null || _e === void 0 ? void 0 : _e['_MainTex'];
        const baseColorTexture = baseColorTextureIndex != null
            ? {
                index: baseColorTextureIndex,
                extensions: Object.assign({}, textureTransformExt),
            }
            : undefined;
        const mtoonExtension = {
            specVersion: '1.0',
            transparentWithZWrite: isTransparentZWrite,
            renderQueueOffsetNumber,
            shadeColorFactor: baseColorFactor,
            shadeMultiplyTexture: baseColorTexture,
        };
        return Object.assign(Object.assign({}, schemaMaterial), { pbrMetallicRoughness: {
                baseColorFactor,
                baseColorTexture,
            }, alphaMode,
            alphaCutoff, extensions: {
                VRMC_materials_mtoon: mtoonExtension,
            } });
    }
    
    _portTextureTransform(materialProperties) {
        var _a, _b, _c, _d, _e;
        const textureTransform = (_a = materialProperties.vectorProperties) === null || _a === void 0 ? void 0 : _a['_MainTex'];
        if (textureTransform == null) {
            return {};
        }
        const offset = [(_b = textureTransform === null || textureTransform === void 0 ? void 0 : textureTransform[0]) !== null && _b !== void 0 ? _b : 0.0, (_c = textureTransform === null || textureTransform === void 0 ? void 0 : textureTransform[1]) !== null && _c !== void 0 ? _c : 0.0];
        const scale = [(_d = textureTransform === null || textureTransform === void 0 ? void 0 : textureTransform[2]) !== null && _d !== void 0 ? _d : 1.0, (_e = textureTransform === null || textureTransform === void 0 ? void 0 : textureTransform[3]) !== null && _e !== void 0 ? _e : 1.0];
        offset[1] = 1.0 - scale[1] - offset[1];
        return {
            KHR_texture_transform: { offset, scale },
        };
    }
    
    _v0ParseRenderQueue(materialProperties) {
        var _a, _b, _c;
        const isTransparent = (_b = (_a = materialProperties.keywordMap) === null || _a === void 0 ? void 0 : _a['_ALPHABLEND_ON']) !== null && _b !== void 0 ? _b : false;
        const enabledZWrite = ((_c = materialProperties.floatProperties) === null || _c === void 0 ? void 0 : _c['_ZWrite']) === 1;
        let offset = 0;
        if (isTransparent) {
            const v0Queue = materialProperties.renderQueue;
            if (v0Queue != null) {
                if (enabledZWrite) {
                    offset = this._renderQueueMapTransparentZWrite.get(v0Queue);
                }
                else {
                    offset = this._renderQueueMapTransparent.get(v0Queue);
                }
            }
        }
        return offset;
    }
    
    _populateRenderQueueMap(materialPropertiesList) {
        
        const renderQueuesTransparent = new Set();
        
        const renderQueuesTransparentZWrite = new Set();
        materialPropertiesList.forEach((materialProperties) => {
            var _a, _b, _c;
            const isTransparent = (_b = (_a = materialProperties.keywordMap) === null || _a === void 0 ? void 0 : _a['_ALPHABLEND_ON']) !== null && _b !== void 0 ? _b : false;
            const enabledZWrite = ((_c = materialProperties.floatProperties) === null || _c === void 0 ? void 0 : _c['_ZWrite']) === 1;
            if (isTransparent) {
                const v0Queue = materialProperties.renderQueue;
                if (v0Queue != null) {
                    if (enabledZWrite) {
                        renderQueuesTransparentZWrite.add(v0Queue);
                    }
                    else {
                        renderQueuesTransparent.add(v0Queue);
                    }
                }
            }
        });
        if (renderQueuesTransparent.size > 10) {
            console.warn(`VRMMaterialsV0CompatPlugin: This VRM uses ${renderQueuesTransparent.size} render queues for Transparent materials while VRM 1.0 only supports up to 10 render queues. The model might not be rendered correctly.`);
        }
        if (renderQueuesTransparentZWrite.size > 10) {
            console.warn(`VRMMaterialsV0CompatPlugin: This VRM uses ${renderQueuesTransparentZWrite.size} render queues for TransparentZWrite materials while VRM 1.0 only supports up to 10 render queues. The model might not be rendered correctly.`);
        }
        Array.from(renderQueuesTransparent)
            .sort()
            .forEach((queue, i) => {
            const newQueueOffset = Math.min(Math.max(i - renderQueuesTransparent.size + 1, -9), 0);
            this._renderQueueMapTransparent.set(queue, newQueueOffset);
        });
        Array.from(renderQueuesTransparentZWrite)
            .sort()
            .forEach((queue, i) => {
            const newQueueOffset = Math.min(Math.max(i, 0), 9);
            this._renderQueueMapTransparentZWrite.set(queue, newQueueOffset);
        });
    }
}



const _v3A$3$1 = new THREE.Vector3();
class VRMNodeConstraintHelper extends THREE.Group {
    constructor(constraint) {
        super();
        this._attrPosition = new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0]), 3);
        this._attrPosition.setUsage(THREE.DynamicDrawUsage);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', this._attrPosition);
        const material = new THREE.LineBasicMaterial({
            color: 0xff00ff,
            depthTest: false,
            depthWrite: false,
        });
        this._line = new THREE.Line(geometry, material);
        this.add(this._line);
        this.constraint = constraint;
    }
    updateMatrixWorld(force) {
        _v3A$3$1.setFromMatrixPosition(this.constraint.destination.matrixWorld);
        this._attrPosition.setXYZ(0, _v3A$3$1.x, _v3A$3$1.y, _v3A$3$1.z);
        if (this.constraint.source) {
            _v3A$3$1.setFromMatrixPosition(this.constraint.source.matrixWorld);
        }
        this._attrPosition.setXYZ(1, _v3A$3$1.x, _v3A$3$1.y, _v3A$3$1.z);
        this._attrPosition.needsUpdate = true;
        super.updateMatrixWorld(force);
    }
}

function decomposePosition(matrix, target) {
    return target.set(matrix.elements[12], matrix.elements[13], matrix.elements[14]);
}

const _v3A$2$1 = new THREE.Vector3();
const _v3B$1$1 = new THREE.Vector3();
function decomposeRotation(matrix, target) {
    matrix.decompose(_v3A$2$1, target, _v3B$1$1);
    return target;
}


function quatInvertCompat(target) {
    if (target.invert) {
        target.invert();
    }
    else {
        target.inverse();
    }
    return target;
}


class VRMNodeConstraint {
    
    constructor(destination, source) {
        this.destination = destination;
        this.source = source;
        this.weight = 1.0;
    }
}

const _v3A$1$1 = new THREE.Vector3();
const _v3B$2 = new THREE.Vector3();
const _v3C$1 = new THREE.Vector3();
const _quatA$2 = new THREE.Quaternion();
const _quatB$2 = new THREE.Quaternion();
const _quatC = new THREE.Quaternion();

class VRMAimConstraint extends VRMNodeConstraint {
    
    get aimAxis() {
        return this._aimAxis;
    }
    
    set aimAxis(aimAxis) {
        this._aimAxis = aimAxis;
        this._v3AimAxis.set(aimAxis === 'PositiveX' ? 1.0 : aimAxis === 'NegativeX' ? -1.0 : 0.0, aimAxis === 'PositiveY' ? 1.0 : aimAxis === 'NegativeY' ? -1.0 : 0.0, aimAxis === 'PositiveZ' ? 1.0 : aimAxis === 'NegativeZ' ? -1.0 : 0.0);
    }
    get dependencies() {
        const set = new Set([this.source]);
        if (this.destination.parent) {
            set.add(this.destination.parent);
        }
        return set;
    }
    constructor(destination, source) {
        super(destination, source);
        this._aimAxis = 'PositiveX';
        this._v3AimAxis = new THREE.Vector3(1, 0, 0);
        this._dstRestQuat = new THREE.Quaternion();
    }
    setInitState() {
        this._dstRestQuat.copy(this.destination.quaternion);
    }
    update() {
        this.destination.updateWorldMatrix(true, false);
        this.source.updateWorldMatrix(true, false);
        const dstParentWorldQuat = _quatA$2.identity();
        const invDstParentWorldQuat = _quatB$2.identity();
        if (this.destination.parent) {
            decomposeRotation(this.destination.parent.matrixWorld, dstParentWorldQuat);
            quatInvertCompat(invDstParentWorldQuat.copy(dstParentWorldQuat));
        }
        const a0 = _v3A$1$1.copy(this._v3AimAxis).applyQuaternion(this._dstRestQuat).applyQuaternion(dstParentWorldQuat);
        const a1 = decomposePosition(this.source.matrixWorld, _v3B$2)
            .sub(decomposePosition(this.destination.matrixWorld, _v3C$1))
            .normalize();
        const targetQuat = _quatC
            .setFromUnitVectors(a0, a1)
            .premultiply(invDstParentWorldQuat)
            .multiply(dstParentWorldQuat)
            .multiply(this._dstRestQuat);
        this.destination.quaternion.copy(this._dstRestQuat).slerp(targetQuat, this.weight);
    }
}



function __awaiter$1(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};


function traverseAncestorsFromRoot$1(object, callback) {
    const ancestors = [object];
    let head = object.parent;
    while (head !== null) {
        ancestors.unshift(head);
        head = head.parent;
    }
    ancestors.forEach((ancestor) => {
        callback(ancestor);
    });
}

class VRMNodeConstraintManager {
    constructor() {
        this._constraints = new Set();
        this._objectConstraintsMap = new Map();
    }
    get constraints() {
        return this._constraints;
    }
    addConstraint(constraint) {
        this._constraints.add(constraint);
        let objectSet = this._objectConstraintsMap.get(constraint.destination);
        if (objectSet == null) {
            objectSet = new Set();
            this._objectConstraintsMap.set(constraint.destination, objectSet);
        }
        objectSet.add(constraint);
    }
    deleteConstraint(constraint) {
        this._constraints.delete(constraint);
        const objectSet = this._objectConstraintsMap.get(constraint.destination);
        objectSet.delete(constraint);
    }
    setInitState() {
        const constraintsTried = new Set();
        const constraintsDone = new Set();
        for (const constraint of this._constraints) {
            this._processConstraint(constraint, constraintsTried, constraintsDone, (constraint) => constraint.setInitState());
        }
    }
    update() {
        const constraintsTried = new Set();
        const constraintsDone = new Set();
        for (const constraint of this._constraints) {
            this._processConstraint(constraint, constraintsTried, constraintsDone, (constraint) => constraint.update());
        }
    }
    
    _processConstraint(constraint, constraintsTried, constraintsDone, callback) {
        if (constraintsDone.has(constraint)) {
            return;
        }
        if (constraintsTried.has(constraint)) {
            throw new Error('VRMNodeConstraintManager: Circular dependency detected while updating constraints');
        }
        constraintsTried.add(constraint);
        const depObjects = constraint.dependencies;
        for (const depObject of depObjects) {
            traverseAncestorsFromRoot$1(depObject, (depObjectAncestor) => {
                const objectSet = this._objectConstraintsMap.get(depObjectAncestor);
                if (objectSet) {
                    for (const depConstraint of objectSet) {
                        this._processConstraint(depConstraint, constraintsTried, constraintsDone, callback);
                    }
                }
            });
        }
        callback(constraint);
        constraintsDone.add(constraint);
    }
}

const _quatA$1 = new THREE.Quaternion();
const _quatB$1 = new THREE.Quaternion();

class VRMRotationConstraint extends VRMNodeConstraint {
    get dependencies() {
        return new Set([this.source]);
    }
    constructor(destination, source) {
        super(destination, source);
        this._dstRestQuat = new THREE.Quaternion();
        this._invSrcRestQuat = new THREE.Quaternion();
    }
    setInitState() {
        this._dstRestQuat.copy(this.destination.quaternion);
        quatInvertCompat(this._invSrcRestQuat.copy(this.source.quaternion));
    }
    update() {
        const srcDeltaQuat = _quatA$1.copy(this._invSrcRestQuat).multiply(this.source.quaternion);
        const targetQuat = _quatB$1.copy(this._dstRestQuat).multiply(srcDeltaQuat);
        this.destination.quaternion.copy(this._dstRestQuat).slerp(targetQuat, this.weight);
    }
}

const _v3A$5 = new THREE.Vector3();
const _quatA$3 = new THREE.Quaternion();
const _quatB = new THREE.Quaternion();

class VRMRollConstraint extends VRMNodeConstraint {
    
    get rollAxis() {
        return this._rollAxis;
    }
    
    set rollAxis(rollAxis) {
        this._rollAxis = rollAxis;
        this._v3RollAxis.set(rollAxis === 'X' ? 1.0 : 0.0, rollAxis === 'Y' ? 1.0 : 0.0, rollAxis === 'Z' ? 1.0 : 0.0);
    }
    get dependencies() {
        return new Set([this.source]);
    }
    constructor(destination, source) {
        super(destination, source);
        this._rollAxis = 'X';
        this._v3RollAxis = new THREE.Vector3(1, 0, 0);
        this._dstRestQuat = new THREE.Quaternion();
        this._invDstRestQuat = new THREE.Quaternion();
        this._invSrcRestQuatMulDstRestQuat = new THREE.Quaternion();
    }
    setInitState() {
        this._dstRestQuat.copy(this.destination.quaternion);
        quatInvertCompat(this._invDstRestQuat.copy(this._dstRestQuat));
        quatInvertCompat(this._invSrcRestQuatMulDstRestQuat.copy(this.source.quaternion)).multiply(this._dstRestQuat);
    }
    update() {
        
        const quatDelta = _quatA$3
            .copy(this._invDstRestQuat)
            .multiply(this.source.quaternion)
            .multiply(this._invSrcRestQuatMulDstRestQuat);
        const n1 = _v3A$5.copy(this._v3RollAxis).applyQuaternion(quatDelta);
        
        const quatFromTo = _quatB.setFromUnitVectors(n1, this._v3RollAxis);
        const targetQuat = quatFromTo.premultiply(this._dstRestQuat).multiply(quatDelta);
        this.destination.quaternion.copy(this._dstRestQuat).slerp(targetQuat, this.weight);
    }
}


const POSSIBLE_SPEC_VERSIONS$1 = new Set(['1.0', '1.0-beta']);
class VRMNodeConstraintLoaderPlugin {
    get name() {
        return VRMNodeConstraintLoaderPlugin.EXTENSION_NAME;
    }
    constructor(parser, options) {
        this.parser = parser;
        this.helperRoot = options === null || options === void 0 ? void 0 : options.helperRoot;
    }
    afterRoot(gltf) {
        return __awaiter$1(this, void 0, void 0, function* () {
            gltf.userData.vrmNodeConstraintManager = yield this._import(gltf);
        });
    }
    
    _import(gltf) {
        var _a;
        return __awaiter$1(this, void 0, void 0, function* () {
            const json = this.parser.json;
            const isConstraintsUsed = ((_a = json.extensionsUsed) === null || _a === void 0 ? void 0 : _a.indexOf(VRMNodeConstraintLoaderPlugin.EXTENSION_NAME)) !== -1;
            if (!isConstraintsUsed) {
                return null;
            }
            const manager = new VRMNodeConstraintManager();
            const threeNodes = yield this.parser.getDependencies('node');
            threeNodes.forEach((node, nodeIndex) => {
                var _a;
                const schemaNode = json.nodes[nodeIndex];
                const extension = (_a = schemaNode === null || schemaNode === void 0 ? void 0 : schemaNode.extensions) === null || _a === void 0 ? void 0 : _a[VRMNodeConstraintLoaderPlugin.EXTENSION_NAME];
                if (extension == null) {
                    return;
                }
                const specVersion = extension.specVersion;
                if (!POSSIBLE_SPEC_VERSIONS$1.has(specVersion)) {
                    console.warn(`VRMNodeConstraintLoaderPlugin: Unknown ${VRMNodeConstraintLoaderPlugin.EXTENSION_NAME} specVersion "${specVersion}"`);
                    return;
                }
                const constraintDef = extension.constraint;
                if (constraintDef.roll != null) {
                    const constraint = this._importRollConstraint(node, threeNodes, constraintDef.roll);
                    manager.addConstraint(constraint);
                }
                else if (constraintDef.aim != null) {
                    const constraint = this._importAimConstraint(node, threeNodes, constraintDef.aim);
                    manager.addConstraint(constraint);
                }
                else if (constraintDef.rotation != null) {
                    const constraint = this._importRotationConstraint(node, threeNodes, constraintDef.rotation);
                    manager.addConstraint(constraint);
                }
            });
            gltf.scene.updateMatrixWorld();
            manager.setInitState();
            return manager;
        });
    }
    _importRollConstraint(destination, nodes, rollConstraintDef) {
        const { source: sourceIndex, rollAxis, weight } = rollConstraintDef;
        const source = nodes[sourceIndex];
        const constraint = new VRMRollConstraint(destination, source);
        if (rollAxis != null) {
            constraint.rollAxis = rollAxis;
        }
        if (weight != null) {
            constraint.weight = weight;
        }
        if (this.helperRoot) {
            const helper = new VRMNodeConstraintHelper(constraint);
            this.helperRoot.add(helper);
        }
        return constraint;
    }
    _importAimConstraint(destination, nodes, aimConstraintDef) {
        const { source: sourceIndex, aimAxis, weight } = aimConstraintDef;
        const source = nodes[sourceIndex];
        const constraint = new VRMAimConstraint(destination, source);
        if (aimAxis != null) {
            constraint.aimAxis = aimAxis;
        }
        if (weight != null) {
            constraint.weight = weight;
        }
        if (this.helperRoot) {
            const helper = new VRMNodeConstraintHelper(constraint);
            this.helperRoot.add(helper);
        }
        return constraint;
    }
    _importRotationConstraint(destination, nodes, rotationConstraintDef) {
        const { source: sourceIndex, weight } = rotationConstraintDef;
        const source = nodes[sourceIndex];
        const constraint = new VRMRotationConstraint(destination, source);
        if (weight != null) {
            constraint.weight = weight;
        }
        if (this.helperRoot) {
            const helper = new VRMNodeConstraintHelper(constraint);
            this.helperRoot.add(helper);
        }
        return constraint;
    }
}
VRMNodeConstraintLoaderPlugin.EXTENSION_NAME = 'VRMC_node_constraint';




class VRMSpringBoneColliderShape {
}

const _v3A$4 = new THREE.Vector3();
const _v3B$1 = new THREE.Vector3();
class VRMSpringBoneColliderShapeCapsule extends VRMSpringBoneColliderShape {
    get type() {
        return 'capsule';
    }
    constructor(params) {
        var _a, _b, _c;
        super();
        this.offset = (_a = params === null || params === void 0 ? void 0 : params.offset) !== null && _a !== void 0 ? _a : new THREE.Vector3(0.0, 0.0, 0.0);
        this.tail = (_b = params === null || params === void 0 ? void 0 : params.tail) !== null && _b !== void 0 ? _b : new THREE.Vector3(0.0, 0.0, 0.0);
        this.radius = (_c = params === null || params === void 0 ? void 0 : params.radius) !== null && _c !== void 0 ? _c : 0.0;
    }
    calculateCollision(colliderMatrix, objectPosition, objectRadius, target) {
        _v3A$4.copy(this.offset).applyMatrix4(colliderMatrix); // transformed head
        _v3B$1.copy(this.tail).applyMatrix4(colliderMatrix); // transformed tail
        _v3B$1.sub(_v3A$4); // from head to tail
        const lengthSqCapsule = _v3B$1.lengthSq();
        target.copy(objectPosition).sub(_v3A$4); // from head to object
        const dot = _v3B$1.dot(target); // dot product of offsetToTail and offsetToObject
        if (dot <= 0.0) ;
        else if (lengthSqCapsule <= dot) {
            target.sub(_v3B$1); // from tail to object
        }
        else {
            _v3B$1.multiplyScalar(dot / lengthSqCapsule); // from head to the nearest point of the shaft
            target.sub(_v3B$1); // from the shaft point to object
        }
        const radius = objectRadius + this.radius;
        const distance = target.length() - radius;
        target.normalize();
        return distance;
    }
}

class VRMSpringBoneColliderShapeSphere extends VRMSpringBoneColliderShape {
    get type() {
        return 'sphere';
    }
    constructor(params) {
        var _a, _b;
        super();
        this.offset = (_a = params === null || params === void 0 ? void 0 : params.offset) !== null && _a !== void 0 ? _a : new THREE.Vector3(0.0, 0.0, 0.0);
        this.radius = (_b = params === null || params === void 0 ? void 0 : params.radius) !== null && _b !== void 0 ? _b : 0.0;
    }
    calculateCollision(colliderMatrix, objectPosition, objectRadius, target) {
        target.copy(this.offset).applyMatrix4(colliderMatrix); // transformed offset
        target.negate().add(objectPosition); // a vector from collider center to object position
        const radius = objectRadius + this.radius;
        const distance = target.length() - radius;
        target.normalize();
        return distance;
    }
}

const _v3A$3 = new THREE.Vector3();
class ColliderShapeCapsuleBufferGeometry extends THREE.BufferGeometry {
    constructor(shape) {
        super();
        this.worldScale = 1.0;
        this._currentRadius = 0;
        this._currentOffset = new THREE.Vector3();
        this._currentTail = new THREE.Vector3();
        this._shape = shape;
        this._attrPos = new THREE.BufferAttribute(new Float32Array(396), 3);
        this.setAttribute('position', this._attrPos);
        this._attrIndex = new THREE.BufferAttribute(new Uint16Array(264), 1);
        this.setIndex(this._attrIndex);
        this._buildIndex();
        this.update();
    }
    update() {
        let shouldUpdateGeometry = false;
        const radius = this._shape.radius / this.worldScale;
        if (this._currentRadius !== radius) {
            this._currentRadius = radius;
            shouldUpdateGeometry = true;
        }
        if (!this._currentOffset.equals(this._shape.offset)) {
            this._currentOffset.copy(this._shape.offset);
            shouldUpdateGeometry = true;
        }
        const tail = _v3A$3.copy(this._shape.tail).divideScalar(this.worldScale);
        if (this._currentTail.distanceToSquared(tail) > 1e-10) {
            this._currentTail.copy(tail);
            shouldUpdateGeometry = true;
        }
        if (shouldUpdateGeometry) {
            this._buildPosition();
        }
    }
    _buildPosition() {
        _v3A$3.copy(this._currentTail).sub(this._currentOffset);
        const l = _v3A$3.length() / this._currentRadius;
        for (let i = 0; i <= 16; i++) {
            const t = (i / 16.0) * Math.PI;
            this._attrPos.setXYZ(i, -Math.sin(t), -Math.cos(t), 0.0);
            this._attrPos.setXYZ(17 + i, l + Math.sin(t), Math.cos(t), 0.0);
            this._attrPos.setXYZ(34 + i, -Math.sin(t), 0.0, -Math.cos(t));
            this._attrPos.setXYZ(51 + i, l + Math.sin(t), 0.0, Math.cos(t));
        }
        for (let i = 0; i < 32; i++) {
            const t = (i / 16.0) * Math.PI;
            this._attrPos.setXYZ(68 + i, 0.0, Math.sin(t), Math.cos(t));
            this._attrPos.setXYZ(100 + i, l, Math.sin(t), Math.cos(t));
        }
        const theta = Math.atan2(_v3A$3.y, Math.sqrt(_v3A$3.x * _v3A$3.x + _v3A$3.z * _v3A$3.z));
        const phi = -Math.atan2(_v3A$3.z, _v3A$3.x);
        this.rotateZ(theta);
        this.rotateY(phi);
        this.scale(this._currentRadius, this._currentRadius, this._currentRadius);
        this.translate(this._currentOffset.x, this._currentOffset.y, this._currentOffset.z);
        this._attrPos.needsUpdate = true;
    }
    _buildIndex() {
        for (let i = 0; i < 34; i++) {
            const i1 = (i + 1) % 34;
            this._attrIndex.setXY(i * 2, i, i1);
            this._attrIndex.setXY(68 + i * 2, 34 + i, 34 + i1);
        }
        for (let i = 0; i < 32; i++) {
            const i1 = (i + 1) % 32;
            this._attrIndex.setXY(136 + i * 2, 68 + i, 68 + i1);
            this._attrIndex.setXY(200 + i * 2, 100 + i, 100 + i1);
        }
        this._attrIndex.needsUpdate = true;
    }
}

class ColliderShapeSphereBufferGeometry extends THREE.BufferGeometry {
    constructor(shape) {
        super();
        this.worldScale = 1.0;
        this._currentRadius = 0;
        this._currentOffset = new THREE.Vector3();
        this._shape = shape;
        this._attrPos = new THREE.BufferAttribute(new Float32Array(32 * 3 * 3), 3);
        this.setAttribute('position', this._attrPos);
        this._attrIndex = new THREE.BufferAttribute(new Uint16Array(64 * 3), 1);
        this.setIndex(this._attrIndex);
        this._buildIndex();
        this.update();
    }
    update() {
        let shouldUpdateGeometry = false;
        const radius = this._shape.radius / this.worldScale;
        if (this._currentRadius !== radius) {
            this._currentRadius = radius;
            shouldUpdateGeometry = true;
        }
        if (!this._currentOffset.equals(this._shape.offset)) {
            this._currentOffset.copy(this._shape.offset);
            shouldUpdateGeometry = true;
        }
        if (shouldUpdateGeometry) {
            this._buildPosition();
        }
    }
    _buildPosition() {
        for (let i = 0; i < 32; i++) {
            const t = (i / 16.0) * Math.PI;
            this._attrPos.setXYZ(i, Math.cos(t), Math.sin(t), 0.0);
            this._attrPos.setXYZ(32 + i, 0.0, Math.cos(t), Math.sin(t));
            this._attrPos.setXYZ(64 + i, Math.sin(t), 0.0, Math.cos(t));
        }
        this.scale(this._currentRadius, this._currentRadius, this._currentRadius);
        this.translate(this._currentOffset.x, this._currentOffset.y, this._currentOffset.z);
        this._attrPos.needsUpdate = true;
    }
    _buildIndex() {
        for (let i = 0; i < 32; i++) {
            const i1 = (i + 1) % 32;
            this._attrIndex.setXY(i * 2, i, i1);
            this._attrIndex.setXY(64 + i * 2, 32 + i, 32 + i1);
            this._attrIndex.setXY(128 + i * 2, 64 + i, 64 + i1);
        }
        this._attrIndex.needsUpdate = true;
    }
}

const _v3A$2 = new THREE.Vector3();
class VRMSpringBoneColliderHelper extends THREE.Group {
    constructor(collider) {
        super();
        this.matrixAutoUpdate = false;
        this.collider = collider;
        if (this.collider.shape instanceof VRMSpringBoneColliderShapeSphere) {
            this._geometry = new ColliderShapeSphereBufferGeometry(this.collider.shape);
        }
        else if (this.collider.shape instanceof VRMSpringBoneColliderShapeCapsule) {
            this._geometry = new ColliderShapeCapsuleBufferGeometry(this.collider.shape);
        }
        else {
            throw new Error('VRMSpringBoneColliderHelper: Unknown collider shape type detected');
        }
        const material = new THREE.LineBasicMaterial({
            color: 0xff00ff,
            depthTest: false,
            depthWrite: false,
        });
        this._line = new THREE.LineSegments(this._geometry, material);
        this.add(this._line);
    }
    dispose() {
        this._geometry.dispose();
    }
    updateMatrixWorld(force) {
        this.collider.updateWorldMatrix(true, false);
        this.matrix.copy(this.collider.matrixWorld);
        const matrixWorldElements = this.matrix.elements;
        this._geometry.worldScale = _v3A$2
            .set(matrixWorldElements[0], matrixWorldElements[1], matrixWorldElements[2])
            .length(); // calculate scale of x component
        this._geometry.update();
        super.updateMatrixWorld(force);
    }
}

class SpringBoneBufferGeometry extends THREE.BufferGeometry {
    constructor(springBone) {
        super();
        this.worldScale = 1.0;
        this._currentRadius = 0;
        this._currentTail = new THREE.Vector3();
        this._springBone = springBone;
        this._attrPos = new THREE.BufferAttribute(new Float32Array(294), 3);
        this.setAttribute('position', this._attrPos);
        this._attrIndex = new THREE.BufferAttribute(new Uint16Array(194), 1);
        this.setIndex(this._attrIndex);
        this._buildIndex();
        this.update();
    }
    update() {
        let shouldUpdateGeometry = false;
        const radius = this._springBone.settings.hitRadius / this.worldScale;
        if (this._currentRadius !== radius) {
            this._currentRadius = radius;
            shouldUpdateGeometry = true;
        }
        if (!this._currentTail.equals(this._springBone.initialLocalChildPosition)) {
            this._currentTail.copy(this._springBone.initialLocalChildPosition);
            shouldUpdateGeometry = true;
        }
        if (shouldUpdateGeometry) {
            this._buildPosition();
        }
    }
    _buildPosition() {
        for (let i = 0; i < 32; i++) {
            const t = (i / 16.0) * Math.PI;
            this._attrPos.setXYZ(i, Math.cos(t), Math.sin(t), 0.0);
            this._attrPos.setXYZ(32 + i, 0.0, Math.cos(t), Math.sin(t));
            this._attrPos.setXYZ(64 + i, Math.sin(t), 0.0, Math.cos(t));
        }
        this.scale(this._currentRadius, this._currentRadius, this._currentRadius);
        this.translate(this._currentTail.x, this._currentTail.y, this._currentTail.z);
        this._attrPos.setXYZ(96, 0, 0, 0);
        this._attrPos.setXYZ(97, this._currentTail.x, this._currentTail.y, this._currentTail.z);
        this._attrPos.needsUpdate = true;
    }
    _buildIndex() {
        for (let i = 0; i < 32; i++) {
            const i1 = (i + 1) % 32;
            this._attrIndex.setXY(i * 2, i, i1);
            this._attrIndex.setXY(64 + i * 2, 32 + i, 32 + i1);
            this._attrIndex.setXY(128 + i * 2, 64 + i, 64 + i1);
        }
        this._attrIndex.setXY(192, 96, 97);
        this._attrIndex.needsUpdate = true;
    }
}

const _v3A$1 = new THREE.Vector3();
class VRMSpringBoneJointHelper extends THREE.Group {
    constructor(springBone) {
        super();
        this.matrixAutoUpdate = false;
        this.springBone = springBone;
        this._geometry = new SpringBoneBufferGeometry(this.springBone);
        const material = new THREE.LineBasicMaterial({
            color: 0xffff00,
            depthTest: false,
            depthWrite: false,
        });
        this._line = new THREE.LineSegments(this._geometry, material);
        this.add(this._line);
    }
    dispose() {
        this._geometry.dispose();
    }
    updateMatrixWorld(force) {
        this.springBone.bone.updateWorldMatrix(true, false);
        this.matrix.copy(this.springBone.bone.matrixWorld);
        const matrixWorldElements = this.matrix.elements;
        this._geometry.worldScale = _v3A$1
            .set(matrixWorldElements[0], matrixWorldElements[1], matrixWorldElements[2])
            .length(); // calculate scale of x component
        this._geometry.update();
        super.updateMatrixWorld(force);
    }
}


class VRMSpringBoneCollider extends THREE.Object3D {
    constructor(shape) {
        super();
        this.shape = shape;
    }
}

const _matA$1 = new THREE.Matrix4();

function mat4InvertCompat(target) {
    if (target.invert) {
        target.invert();
    }
    else {
        target.getInverse(_matA$1.copy(target));
    }
    return target;
}

class Matrix4InverseCache {
    
    get inverse() {
        if (this._shouldUpdateInverse) {
            this._inverseCache.copy(this.matrix);
            mat4InvertCompat(this._inverseCache);
            this._shouldUpdateInverse = false;
        }
        return this._inverseCache;
    }
    constructor(matrix) {
        
        this._inverseCache = new THREE.Matrix4();
        
        this._shouldUpdateInverse = true;
        this.matrix = matrix;
        const handler = {
            set: (obj, prop, newVal) => {
                this._shouldUpdateInverse = true;
                obj[prop] = newVal;
                return true;
            },
        };
        this._originalElements = matrix.elements;
        matrix.elements = new Proxy(matrix.elements, handler);
    }
    revert() {
        this.matrix.elements = this._originalElements;
    }
}

const IDENTITY_MATRIX4 = new THREE.Matrix4();
const _v3A = new THREE.Vector3();
const _v3B = new THREE.Vector3();
const _v3C = new THREE.Vector3();

const _worldSpacePosition = new THREE.Vector3();

const _centerSpacePosition = new THREE.Vector3();

const _nextTail = new THREE.Vector3();
const _quatA = new THREE.Quaternion();
const _matA = new THREE.Matrix4();
const _matB = new THREE.Matrix4();

class VRMSpringBoneJoint {
    get center() {
        return this._center;
    }
    set center(center) {
        var _a;
        if ((_a = this._center) === null || _a === void 0 ? void 0 : _a.userData.inverseCacheProxy) {
            this._center.userData.inverseCacheProxy.revert();
            delete this._center.userData.inverseCacheProxy;
        }
        this._center = center;
        if (this._center) {
            if (!this._center.userData.inverseCacheProxy) {
                this._center.userData.inverseCacheProxy = new Matrix4InverseCache(this._center.matrixWorld);
            }
        }
    }
    get initialLocalChildPosition() {
        return this._initialLocalChildPosition;
    }
    
    get _parentMatrixWorld() {
        return this.bone.parent ? this.bone.parent.matrixWorld : IDENTITY_MATRIX4;
    }
    
    constructor(bone, child, settings = {}, colliderGroups = []) {
        var _a, _b, _c, _d, _e, _f;
        
        this._currentTail = new THREE.Vector3();
        
        this._prevTail = new THREE.Vector3();
        
        this._boneAxis = new THREE.Vector3();
        
        this._worldSpaceBoneLength = 0.0;
        
        this._center = null;
        
        this._initialLocalMatrix = new THREE.Matrix4();
        
        this._initialLocalRotation = new THREE.Quaternion();
        
        this._initialLocalChildPosition = new THREE.Vector3();
        this.bone = bone; // uniVRMでの parent
        this.bone.matrixAutoUpdate = false; // updateにより計算されるのでthree.js内での自動処理は不要
        this.child = child;
        this.settings = {
            hitRadius: (_a = settings.hitRadius) !== null && _a !== void 0 ? _a : 0.0,
            stiffness: (_b = settings.stiffness) !== null && _b !== void 0 ? _b : 1.0,
            gravityPower: (_c = settings.gravityPower) !== null && _c !== void 0 ? _c : 0.0,
            gravityDir: (_e = (_d = settings.gravityDir) === null || _d === void 0 ? void 0 : _d.clone()) !== null && _e !== void 0 ? _e : new THREE.Vector3(0.0, -1.0, 0.0),
            dragForce: (_f = settings.dragForce) !== null && _f !== void 0 ? _f : 0.4,
        };
        this.colliderGroups = colliderGroups;
    }
    
    setInitState() {
        this._initialLocalMatrix.copy(this.bone.matrix);
        this._initialLocalRotation.copy(this.bone.quaternion);
        if (this.child) {
            this._initialLocalChildPosition.copy(this.child.position);
        }
        else {
            this._initialLocalChildPosition.copy(this.bone.position).normalize().multiplyScalar(0.07);
        }
        const matrixWorldToCenter = this._getMatrixWorldToCenter(_matA);
        this.bone.localToWorld(this._currentTail.copy(this._initialLocalChildPosition)).applyMatrix4(matrixWorldToCenter);
        this._prevTail.copy(this._currentTail);
        this._boneAxis.copy(this._initialLocalChildPosition).normalize();
    }
    
    reset() {
        this.bone.quaternion.copy(this._initialLocalRotation);
        this.bone.updateMatrix();
        this.bone.matrixWorld.multiplyMatrices(this._parentMatrixWorld, this.bone.matrix);
        const matrixWorldToCenter = this._getMatrixWorldToCenter(_matA);
        this.bone.localToWorld(this._currentTail.copy(this._initialLocalChildPosition)).applyMatrix4(matrixWorldToCenter);
        this._prevTail.copy(this._currentTail);
    }
    
    update(delta) {
        if (delta <= 0)
            return;
        this._calcWorldSpaceBoneLength();
        _worldSpacePosition.setFromMatrixPosition(this.bone.matrixWorld);
        let matrixWorldToCenter = this._getMatrixWorldToCenter(_matA);
        _centerSpacePosition.copy(_worldSpacePosition).applyMatrix4(matrixWorldToCenter);
        const quatWorldToCenter = _quatA.setFromRotationMatrix(matrixWorldToCenter);
        const centerSpaceParentMatrix = _matB.copy(matrixWorldToCenter).multiply(this._parentMatrixWorld);
        const centerSpaceBoneAxis = _v3B
            .copy(this._boneAxis)
            .applyMatrix4(this._initialLocalMatrix)
            .applyMatrix4(centerSpaceParentMatrix)
            .sub(_centerSpacePosition)
            .normalize();
        const centerSpaceGravity = _v3C.copy(this.settings.gravityDir).applyQuaternion(quatWorldToCenter).normalize();
        const matrixCenterToWorld = this._getMatrixCenterToWorld(_matA);
        _nextTail
            .copy(this._currentTail)
            .add(_v3A
            .copy(this._currentTail)
            .sub(this._prevTail)
            .multiplyScalar(1 - this.settings.dragForce)) // 前フレームの移動を継続する(減衰もあるよ)
            .add(_v3A.copy(centerSpaceBoneAxis).multiplyScalar(this.settings.stiffness * delta)) // 親の回転による子ボーンの移動目標
            .add(_v3A.copy(centerSpaceGravity).multiplyScalar(this.settings.gravityPower * delta)) // 外力による移動量
            .applyMatrix4(matrixCenterToWorld); // tailをworld spaceに戻す
        _nextTail.sub(_worldSpacePosition).normalize().multiplyScalar(this._worldSpaceBoneLength).add(_worldSpacePosition);
        this._collision(_nextTail);
        matrixWorldToCenter = this._getMatrixWorldToCenter(_matA);
        this._prevTail.copy(this._currentTail);
        this._currentTail.copy(_v3A.copy(_nextTail).applyMatrix4(matrixWorldToCenter));
        const worldSpaceInitialMatrixInv = mat4InvertCompat(_matA.copy(this._parentMatrixWorld).multiply(this._initialLocalMatrix));
        const applyRotation = _quatA.setFromUnitVectors(this._boneAxis, _v3A.copy(_nextTail).applyMatrix4(worldSpaceInitialMatrixInv).normalize());
        this.bone.quaternion.copy(this._initialLocalRotation).multiply(applyRotation);
        this.bone.updateMatrix();
        this.bone.matrixWorld.multiplyMatrices(this._parentMatrixWorld, this.bone.matrix);
    }
    
    _collision(tail) {
        this.colliderGroups.forEach((colliderGroup) => {
            colliderGroup.colliders.forEach((collider) => {
                const dist = collider.shape.calculateCollision(collider.matrixWorld, tail, this.settings.hitRadius, _v3A);
                if (dist < 0.0) {
                    tail.add(_v3A.multiplyScalar(-dist));
                    tail.sub(_worldSpacePosition).normalize().multiplyScalar(this._worldSpaceBoneLength).add(_worldSpacePosition);
                }
            });
        });
    }
    
    _calcWorldSpaceBoneLength() {
        _v3A.setFromMatrixPosition(this.bone.matrixWorld); // get world position of this.bone
        if (this.child) {
            _v3B.setFromMatrixPosition(this.child.matrixWorld); // get world position of this.child
        }
        else {
            _v3B.copy(this._initialLocalChildPosition);
            _v3B.applyMatrix4(this.bone.matrixWorld);
        }
        this._worldSpaceBoneLength = _v3A.sub(_v3B).length();
    }
    
    _getMatrixCenterToWorld(target) {
        if (this._center) {
            target.copy(this._center.matrixWorld);
        }
        else {
            target.identity();
        }
        return target;
    }
    
    _getMatrixWorldToCenter(target) {
        if (this._center) {
            target.copy(this._center.userData.inverseCacheProxy.inverse);
        }
        else {
            target.identity();
        }
        return target;
    }
}



function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function traverseAncestorsFromRoot(object, callback) {
    const ancestors = [];
    let head = object;
    while (head !== null) {
        ancestors.unshift(head);
        head = head.parent;
    }
    ancestors.forEach((ancestor) => {
        callback(ancestor);
    });
}


function traverseChildrenUntilConditionMet(object, callback) {
    object.children.forEach((child) => {
        const result = callback(child);
        if (!result) {
            traverseChildrenUntilConditionMet(child, callback);
        }
    });
}

class VRMSpringBoneManager {
    constructor() {
        this._joints = new Set();
        this._objectSpringBonesMap = new Map();
    }
    get joints() {
        return this._joints;
    }
    
    get springBones() {
        console.warn('VRMSpringBoneManager: springBones is deprecated. use joints instead.');
        return this._joints;
    }
    get colliderGroups() {
        const set = new Set();
        this._joints.forEach((springBone) => {
            springBone.colliderGroups.forEach((colliderGroup) => {
                set.add(colliderGroup);
            });
        });
        return Array.from(set);
    }
    get colliders() {
        const set = new Set();
        this.colliderGroups.forEach((colliderGroup) => {
            colliderGroup.colliders.forEach((collider) => {
                set.add(collider);
            });
        });
        return Array.from(set);
    }
    addJoint(joint) {
        this._joints.add(joint);
        let objectSet = this._objectSpringBonesMap.get(joint.bone);
        if (objectSet == null) {
            objectSet = new Set();
            this._objectSpringBonesMap.set(joint.bone, objectSet);
        }
        objectSet.add(joint);
    }
    
    addSpringBone(joint) {
        console.warn('VRMSpringBoneManager: addSpringBone() is deprecated. use addJoint() instead.');
        this.addJoint(joint);
    }
    deleteJoint(joint) {
        this._joints.delete(joint);
        const objectSet = this._objectSpringBonesMap.get(joint.bone);
        objectSet.delete(joint);
    }
    
    deleteSpringBone(joint) {
        console.warn('VRMSpringBoneManager: deleteSpringBone() is deprecated. use deleteJoint() instead.');
        this.deleteJoint(joint);
    }
    setInitState() {
        const springBonesTried = new Set();
        const springBonesDone = new Set();
        const objectUpdated = new Set();
        for (const springBone of this._joints) {
            this._processSpringBone(springBone, springBonesTried, springBonesDone, objectUpdated, (springBone) => springBone.setInitState());
        }
    }
    reset() {
        const springBonesTried = new Set();
        const springBonesDone = new Set();
        const objectUpdated = new Set();
        for (const springBone of this._joints) {
            this._processSpringBone(springBone, springBonesTried, springBonesDone, objectUpdated, (springBone) => springBone.reset());
        }
    }
    update(delta) {
        const springBonesTried = new Set();
        const springBonesDone = new Set();
        const objectUpdated = new Set();
        for (const springBone of this._joints) {
            this._processSpringBone(springBone, springBonesTried, springBonesDone, objectUpdated, (springBone) => springBone.update(delta));
            traverseChildrenUntilConditionMet(springBone.bone, (object) => {
                var _a, _b;
                if (((_b = (_a = this._objectSpringBonesMap.get(object)) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0) > 0) {
                    return true;
                }
                object.updateWorldMatrix(false, false);
                return false;
            });
        }
    }
    
    _processSpringBone(springBone, springBonesTried, springBonesDone, objectUpdated, callback) {
        if (springBonesDone.has(springBone)) {
            return;
        }
        if (springBonesTried.has(springBone)) {
            throw new Error('VRMSpringBoneManager: Circular dependency detected while updating springbones');
        }
        springBonesTried.add(springBone);
        const depObjects = this._getDependencies(springBone);
        for (const depObject of depObjects) {
            traverseAncestorsFromRoot(depObject, (depObjectAncestor) => {
                const objectSet = this._objectSpringBonesMap.get(depObjectAncestor);
                if (objectSet) {
                    for (const depSpringBone of objectSet) {
                        this._processSpringBone(depSpringBone, springBonesTried, springBonesDone, objectUpdated, callback);
                    }
                }
                else if (!objectUpdated.has(depObjectAncestor)) {
                    depObjectAncestor.updateWorldMatrix(false, false);
                    objectUpdated.add(depObjectAncestor);
                }
            });
        }
        springBone.bone.updateMatrix();
        springBone.bone.updateWorldMatrix(false, false);
        callback(springBone);
        objectUpdated.add(springBone.bone);
        springBonesDone.add(springBone);
    }
    
    _getDependencies(springBone) {
        const set = new Set();
        const parent = springBone.bone.parent;
        if (parent) {
            set.add(parent);
        }
        springBone.colliderGroups.forEach((colliderGroup) => {
            colliderGroup.colliders.forEach((collider) => {
                set.add(collider);
            });
        });
        return set;
    }
}


const POSSIBLE_SPEC_VERSIONS = new Set(['1.0', '1.0-beta']);
class VRMSpringBoneLoaderPlugin {
    get name() {
        return VRMSpringBoneLoaderPlugin.EXTENSION_NAME;
    }
    constructor(parser, options) {
        this.parser = parser;
        this.jointHelperRoot = options === null || options === void 0 ? void 0 : options.jointHelperRoot;
        this.colliderHelperRoot = options === null || options === void 0 ? void 0 : options.colliderHelperRoot;
    }
    afterRoot(gltf) {
        return __awaiter(this, void 0, void 0, function* () {
            gltf.userData.vrmSpringBoneManager = yield this._import(gltf);
        });
    }
    
    _import(gltf) {
        return __awaiter(this, void 0, void 0, function* () {
            const v1Result = yield this._v1Import(gltf);
            if (v1Result != null) {
                return v1Result;
            }
            const v0Result = yield this._v0Import(gltf);
            if (v0Result != null) {
                return v0Result;
            }
            return null;
        });
    }
    _v1Import(gltf) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const json = gltf.parser.json;
            const isSpringBoneUsed = ((_a = json.extensionsUsed) === null || _a === void 0 ? void 0 : _a.indexOf(VRMSpringBoneLoaderPlugin.EXTENSION_NAME)) !== -1;
            if (!isSpringBoneUsed) {
                return null;
            }
            const manager = new VRMSpringBoneManager();
            const threeNodes = yield gltf.parser.getDependencies('node');
            const extension = (_b = json.extensions) === null || _b === void 0 ? void 0 : _b[VRMSpringBoneLoaderPlugin.EXTENSION_NAME];
            if (!extension) {
                return null;
            }
            const specVersion = extension.specVersion;
            if (!POSSIBLE_SPEC_VERSIONS.has(specVersion)) {
                console.warn(`VRMSpringBoneLoaderPlugin: Unknown ${VRMSpringBoneLoaderPlugin.EXTENSION_NAME} specVersion "${specVersion}"`);
                return null;
            }
            const colliders = (_c = extension.colliders) === null || _c === void 0 ? void 0 : _c.map((schemaCollider, iCollider) => {
                var _a, _b, _c, _d, _e;
                const node = threeNodes[schemaCollider.node];
                const schemaShape = schemaCollider.shape;
                if (schemaShape.sphere) {
                    return this._importSphereCollider(node, {
                        offset: new THREE.Vector3().fromArray((_a = schemaShape.sphere.offset) !== null && _a !== void 0 ? _a : [0.0, 0.0, 0.0]),
                        radius: (_b = schemaShape.sphere.radius) !== null && _b !== void 0 ? _b : 0.0,
                    });
                }
                else if (schemaShape.capsule) {
                    return this._importCapsuleCollider(node, {
                        offset: new THREE.Vector3().fromArray((_c = schemaShape.capsule.offset) !== null && _c !== void 0 ? _c : [0.0, 0.0, 0.0]),
                        radius: (_d = schemaShape.capsule.radius) !== null && _d !== void 0 ? _d : 0.0,
                        tail: new THREE.Vector3().fromArray((_e = schemaShape.capsule.tail) !== null && _e !== void 0 ? _e : [0.0, 0.0, 0.0]),
                    });
                }
                throw new Error(`VRMSpringBoneLoaderPlugin: The collider #${iCollider} has no valid shape`);
            });
            const colliderGroups = (_d = extension.colliderGroups) === null || _d === void 0 ? void 0 : _d.map((schemaColliderGroup, iColliderGroup) => {
                var _a;
                const cols = ((_a = schemaColliderGroup.colliders) !== null && _a !== void 0 ? _a : []).map((iCollider) => {
                    const col = colliders === null || colliders === void 0 ? void 0 : colliders[iCollider];
                    if (col == null) {
                        throw new Error(`VRMSpringBoneLoaderPlugin: The colliderGroup #${iColliderGroup} attempted to use a collider #${iCollider} but not found`);
                    }
                    return col;
                });
                return {
                    colliders: cols,
                    name: schemaColliderGroup.name,
                };
            });
            (_e = extension.springs) === null || _e === void 0 ? void 0 : _e.forEach((schemaSpring, iSpring) => {
                var _a;
                const schemaJoints = schemaSpring.joints;
                const colliderGroupsForSpring = (_a = schemaSpring.colliderGroups) === null || _a === void 0 ? void 0 : _a.map((iColliderGroup) => {
                    const group = colliderGroups === null || colliderGroups === void 0 ? void 0 : colliderGroups[iColliderGroup];
                    if (group == null) {
                        throw new Error(`VRMSpringBoneLoaderPlugin: The spring #${iSpring} attempted to use a colliderGroup ${iColliderGroup} but not found`);
                    }
                    return group;
                });
                const center = schemaSpring.center != null ? threeNodes[schemaSpring.center] : undefined;
                let prevSchemaJoint;
                schemaJoints.forEach((schemaJoint) => {
                    if (prevSchemaJoint) {
                        const nodeIndex = prevSchemaJoint.node;
                        const node = threeNodes[nodeIndex];
                        const childIndex = schemaJoint.node;
                        const child = threeNodes[childIndex];
                        const setting = {
                            hitRadius: prevSchemaJoint.hitRadius,
                            dragForce: prevSchemaJoint.dragForce,
                            gravityPower: prevSchemaJoint.gravityPower,
                            stiffness: prevSchemaJoint.stiffness,
                            gravityDir: prevSchemaJoint.gravityDir != null
                                ? new THREE.Vector3().fromArray(prevSchemaJoint.gravityDir)
                                : undefined,
                        };
                        const joint = this._importJoint(node, child, setting, colliderGroupsForSpring);
                        if (center) {
                            joint.center = center;
                        }
                        manager.addJoint(joint);
                    }
                    prevSchemaJoint = schemaJoint;
                });
            });
            manager.setInitState();
            return manager;
        });
    }
    _v0Import(gltf) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const json = gltf.parser.json;
            const isVRMUsed = ((_a = json.extensionsUsed) === null || _a === void 0 ? void 0 : _a.indexOf('VRM')) !== -1;
            if (!isVRMUsed) {
                return null;
            }
            const extension = (_b = json.extensions) === null || _b === void 0 ? void 0 : _b['VRM'];
            const schemaSecondaryAnimation = extension === null || extension === void 0 ? void 0 : extension.secondaryAnimation;
            if (!schemaSecondaryAnimation) {
                return null;
            }
            const schemaBoneGroups = schemaSecondaryAnimation === null || schemaSecondaryAnimation === void 0 ? void 0 : schemaSecondaryAnimation.boneGroups;
            if (!schemaBoneGroups) {
                return null;
            }
            const manager = new VRMSpringBoneManager();
            const threeNodes = yield gltf.parser.getDependencies('node');
            const colliderGroups = (_c = schemaSecondaryAnimation.colliderGroups) === null || _c === void 0 ? void 0 : _c.map((schemaColliderGroup) => {
                var _a;
                const node = threeNodes[schemaColliderGroup.node];
                const colliders = ((_a = schemaColliderGroup.colliders) !== null && _a !== void 0 ? _a : []).map((schemaCollider, iCollider) => {
                    var _a, _b, _c;
                    const offset = new THREE.Vector3(0.0, 0.0, 0.0);
                    if (schemaCollider.offset) {
                        offset.set((_a = schemaCollider.offset.x) !== null && _a !== void 0 ? _a : 0.0, (_b = schemaCollider.offset.y) !== null && _b !== void 0 ? _b : 0.0, schemaCollider.offset.z ? -schemaCollider.offset.z : 0.0);
                    }
                    return this._importSphereCollider(node, {
                        offset,
                        radius: (_c = schemaCollider.radius) !== null && _c !== void 0 ? _c : 0.0,
                    });
                });
                return { colliders };
            });
            schemaBoneGroups === null || schemaBoneGroups === void 0 ? void 0 : schemaBoneGroups.forEach((schemaBoneGroup, iBoneGroup) => {
                const rootIndices = schemaBoneGroup.bones;
                if (!rootIndices) {
                    return;
                }
                rootIndices.forEach((rootIndex) => {
                    var _a, _b, _c, _d;
                    const root = threeNodes[rootIndex];
                    const gravityDir = new THREE.Vector3();
                    if (schemaBoneGroup.gravityDir) {
                        gravityDir.set((_a = schemaBoneGroup.gravityDir.x) !== null && _a !== void 0 ? _a : 0.0, (_b = schemaBoneGroup.gravityDir.y) !== null && _b !== void 0 ? _b : 0.0, (_c = schemaBoneGroup.gravityDir.z) !== null && _c !== void 0 ? _c : 0.0);
                    }
                    else {
                        gravityDir.set(0.0, -1.0, 0.0);
                    }
                    const center = schemaBoneGroup.center != null ? threeNodes[schemaBoneGroup.center] : undefined;
                    const setting = {
                        hitRadius: schemaBoneGroup.hitRadius,
                        dragForce: schemaBoneGroup.dragForce,
                        gravityPower: schemaBoneGroup.gravityPower,
                        stiffness: schemaBoneGroup.stiffiness,
                        gravityDir,
                    };
                    const colliderGroupsForSpring = (_d = schemaBoneGroup.colliderGroups) === null || _d === void 0 ? void 0 : _d.map((iColliderGroup) => {
                        const group = colliderGroups === null || colliderGroups === void 0 ? void 0 : colliderGroups[iColliderGroup];
                        if (group == null) {
                            throw new Error(`VRMSpringBoneLoaderPlugin: The spring #${iBoneGroup} attempted to use a colliderGroup ${iColliderGroup} but not found`);
                        }
                        return group;
                    });
                    root.traverse((node) => {
                        var _a;
                        const child = (_a = node.children[0]) !== null && _a !== void 0 ? _a : null;
                        const joint = this._importJoint(node, child, setting, colliderGroupsForSpring);
                        if (center) {
                            joint.center = center;
                        }
                        manager.addJoint(joint);
                    });
                });
            });
            gltf.scene.updateMatrixWorld();
            manager.setInitState();
            return manager;
        });
    }
    _importJoint(node, child, setting, colliderGroupsForSpring) {
        const springBone = new VRMSpringBoneJoint(node, child, setting, colliderGroupsForSpring);
        if (this.jointHelperRoot) {
            const helper = new VRMSpringBoneJointHelper(springBone);
            this.jointHelperRoot.add(helper);
            helper.renderOrder = this.jointHelperRoot.renderOrder;
        }
        return springBone;
    }
    _importSphereCollider(destination, params) {
        const { offset, radius } = params;
        const shape = new VRMSpringBoneColliderShapeSphere({ offset, radius });
        const collider = new VRMSpringBoneCollider(shape);
        destination.add(collider);
        if (this.colliderHelperRoot) {
            const helper = new VRMSpringBoneColliderHelper(collider);
            this.colliderHelperRoot.add(helper);
            helper.renderOrder = this.colliderHelperRoot.renderOrder;
        }
        return collider;
    }
    _importCapsuleCollider(destination, params) {
        const { offset, radius, tail } = params;
        const shape = new VRMSpringBoneColliderShapeCapsule({ offset, radius, tail });
        const collider = new VRMSpringBoneCollider(shape);
        destination.add(collider);
        if (this.colliderHelperRoot) {
            const helper = new VRMSpringBoneColliderHelper(collider);
            this.colliderHelperRoot.add(helper);
            helper.renderOrder = this.colliderHelperRoot.renderOrder;
        }
        return collider;
    }
}
VRMSpringBoneLoaderPlugin.EXTENSION_NAME = 'VRMC_springBone';

class VRMLoaderPlugin {
    get name() {
        return 'VRMLoaderPlugin';
    }
    constructor(parser, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.parser = parser;
        const helperRoot = options === null || options === void 0 ? void 0 : options.helperRoot;
        const autoUpdateHumanBones = options === null || options === void 0 ? void 0 : options.autoUpdateHumanBones;
        this.expressionPlugin = (_a = options === null || options === void 0 ? void 0 : options.expressionPlugin) !== null && _a !== void 0 ? _a : new VRMExpressionLoaderPlugin(parser);
        this.firstPersonPlugin = (_b = options === null || options === void 0 ? void 0 : options.firstPersonPlugin) !== null && _b !== void 0 ? _b : new VRMFirstPersonLoaderPlugin(parser);
        this.humanoidPlugin =
            (_c = options === null || options === void 0 ? void 0 : options.humanoidPlugin) !== null && _c !== void 0 ? _c : new VRMHumanoidLoaderPlugin(parser, {
                helperRoot,
                autoUpdateHumanBones,
            });
        this.lookAtPlugin = (_d = options === null || options === void 0 ? void 0 : options.lookAtPlugin) !== null && _d !== void 0 ? _d : new VRMLookAtLoaderPlugin(parser, { helperRoot });
        this.metaPlugin = (_e = options === null || options === void 0 ? void 0 : options.metaPlugin) !== null && _e !== void 0 ? _e : new VRMMetaLoaderPlugin(parser);
        this.mtoonMaterialPlugin = (_f = options === null || options === void 0 ? void 0 : options.mtoonMaterialPlugin) !== null && _f !== void 0 ? _f : new MToonMaterialLoaderPlugin(parser);
        this.materialsHDREmissiveMultiplierPlugin =
            (_g = options === null || options === void 0 ? void 0 : options.materialsHDREmissiveMultiplierPlugin) !== null && _g !== void 0 ? _g : new VRMMaterialsHDREmissiveMultiplierLoaderPlugin(parser);
        this.materialsV0CompatPlugin = (_h = options === null || options === void 0 ? void 0 : options.materialsV0CompatPlugin) !== null && _h !== void 0 ? _h : new VRMMaterialsV0CompatPlugin(parser);
        this.springBonePlugin =
            (_j = options === null || options === void 0 ? void 0 : options.springBonePlugin) !== null && _j !== void 0 ? _j : new VRMSpringBoneLoaderPlugin(parser, {
                colliderHelperRoot: helperRoot,
                jointHelperRoot: helperRoot,
            });
        this.nodeConstraintPlugin =
            (_k = options === null || options === void 0 ? void 0 : options.nodeConstraintPlugin) !== null && _k !== void 0 ? _k : new VRMNodeConstraintLoaderPlugin(parser, { helperRoot });
    }
    beforeRoot() {
        return __awaiter$5(this, void 0, void 0, function* () {
            yield this.materialsV0CompatPlugin.beforeRoot();
            yield this.mtoonMaterialPlugin.beforeRoot();
        });
    }
    loadMesh(meshIndex) {
        return __awaiter$5(this, void 0, void 0, function* () {
            return yield this.mtoonMaterialPlugin.loadMesh(meshIndex);
        });
    }
    getMaterialType(materialIndex) {
        const mtoonType = this.mtoonMaterialPlugin.getMaterialType(materialIndex);
        if (mtoonType != null) {
            return mtoonType;
        }
        return null;
    }
    extendMaterialParams(materialIndex, materialParams) {
        return __awaiter$5(this, void 0, void 0, function* () {
            yield this.materialsHDREmissiveMultiplierPlugin.extendMaterialParams(materialIndex, materialParams);
            yield this.mtoonMaterialPlugin.extendMaterialParams(materialIndex, materialParams);
        });
    }
    afterRoot(gltf) {
        return __awaiter$5(this, void 0, void 0, function* () {
            yield this.metaPlugin.afterRoot(gltf);
            yield this.humanoidPlugin.afterRoot(gltf);
            yield this.expressionPlugin.afterRoot(gltf);
            yield this.lookAtPlugin.afterRoot(gltf);
            yield this.firstPersonPlugin.afterRoot(gltf);
            yield this.springBonePlugin.afterRoot(gltf);
            yield this.nodeConstraintPlugin.afterRoot(gltf);
            yield this.mtoonMaterialPlugin.afterRoot(gltf);
            const meta = gltf.userData.vrmMeta;
            const humanoid = gltf.userData.vrmHumanoid;
            if (meta && humanoid) {
                const vrm = new VRM({
                    scene: gltf.scene,
                    expressionManager: gltf.userData.vrmExpressionManager,
                    firstPerson: gltf.userData.vrmFirstPerson,
                    humanoid,
                    lookAt: gltf.userData.vrmLookAt,
                    meta,
                    materials: gltf.userData.vrmMToonMaterials,
                    springBoneManager: gltf.userData.vrmSpringBoneManager,
                    nodeConstraintManager: gltf.userData.vrmNodeConstraintManager,
                });
                gltf.userData.vrm = vrm;
            }
        });
    }
}

function disposeMaterial(material) {
    Object.values(material).forEach((value) => {
        if (value === null || value === void 0 ? void 0 : value.isTexture) {
            const texture = value;
            texture.dispose();
        }
    });
    if (material.isShaderMaterial) {
        const uniforms = material.uniforms;
        if (uniforms) {
            Object.values(uniforms).forEach((uniform) => {
                const value = uniform.value;
                if (value === null || value === void 0 ? void 0 : value.isTexture) {
                    const texture = value;
                    texture.dispose();
                }
            });
        }
    }
    material.dispose();
}
function dispose(object3D) {
    const geometry = object3D.geometry;
    if (geometry) {
        geometry.dispose();
    }
    const skeleton = object3D.skeleton;
    if (skeleton) {
        skeleton.dispose();
    }
    const material = object3D.material;
    if (material) {
        if (Array.isArray(material)) {
            material.forEach((material) => disposeMaterial(material));
        }
        else if (material) {
            disposeMaterial(material);
        }
    }
}
function deepDispose(object3D) {
    object3D.traverse(dispose);
}


function removeUnnecessaryJoints(root) {
    const skeletonList = new Map();
    root.traverse((obj) => {
        if (obj.type !== 'SkinnedMesh') {
            return;
        }
        const mesh = obj;
        const geometry = mesh.geometry;
        const attribute = geometry.getAttribute('skinIndex');
        let skeleton = skeletonList.get(attribute);
        if (!skeleton) {
            const bones = []; // new list of bone
            const boneInverses = []; // new list of boneInverse
            const boneIndexMap = {}; // map of old bone index vs. new bone index
            const array = attribute.array;
            for (let i = 0; i < array.length; i++) {
                const index = array[i];
                if (boneIndexMap[index] === undefined) {
                    boneIndexMap[index] = bones.length;
                    bones.push(mesh.skeleton.bones[index]);
                    boneInverses.push(mesh.skeleton.boneInverses[index]);
                }
                array[i] = boneIndexMap[index];
            }
            attribute.copyArray(array);
            attribute.needsUpdate = true;
            skeleton = new THREE.Skeleton(bones, boneInverses);
            skeletonList.set(attribute, skeleton);
        }
        mesh.bind(skeleton, new THREE.Matrix4());
    });
}


function removeUnnecessaryVertices(root) {
    const geometryMap = new Map();
    root.traverse((obj) => {
        var _a, _b, _c, _d;
        if (!obj.isMesh) {
            return;
        }
        const mesh = obj;
        const geometry = mesh.geometry;
        const origianlIndex = geometry.index;
        if (origianlIndex == null) {
            return;
        }
        const newGeometryAlreadyExisted = geometryMap.get(geometry);
        if (newGeometryAlreadyExisted != null) {
            mesh.geometry = newGeometryAlreadyExisted;
            return;
        }
        const newGeometry = new THREE.BufferGeometry();
        newGeometry.name = geometry.name;
        newGeometry.morphTargetsRelative = geometry.morphTargetsRelative;
        geometry.groups.forEach((group) => {
            newGeometry.addGroup(group.start, group.count, group.materialIndex);
        });
        newGeometry.boundingBox = (_b = (_a = geometry.boundingBox) === null || _a === void 0 ? void 0 : _a.clone()) !== null && _b !== void 0 ? _b : null;
        newGeometry.boundingSphere = (_d = (_c = geometry.boundingSphere) === null || _c === void 0 ? void 0 : _c.clone()) !== null && _d !== void 0 ? _d : null;
        newGeometry.setDrawRange(geometry.drawRange.start, geometry.drawRange.count);
        newGeometry.userData = geometry.userData;
        geometryMap.set(geometry, newGeometry);
        
        const originalIndexNewIndexMap = [];
        
        const newIndexOriginalIndexMap = [];
        {
            const originalIndexArray = origianlIndex.array;
            const newIndexArray = new originalIndexArray.constructor(originalIndexArray.length);
            let indexHead = 0;
            for (let i = 0; i < originalIndexArray.length; i++) {
                const originalIndex = originalIndexArray[i];
                let newIndex = originalIndexNewIndexMap[originalIndex];
                if (newIndex == null) {
                    originalIndexNewIndexMap[originalIndex] = indexHead;
                    newIndexOriginalIndexMap[indexHead] = originalIndex;
                    newIndex = indexHead;
                    indexHead++;
                }
                newIndexArray[i] = newIndex;
            }
            newGeometry.setIndex(new BufferAttribute(newIndexArray, 1, false));
        }
        Object.keys(geometry.attributes).forEach((attributeName) => {
            const originalAttribute = geometry.attributes[attributeName];
            if (originalAttribute.isInterleavedBufferAttribute) {
                throw new Error('removeUnnecessaryVertices: InterleavedBufferAttribute is not supported');
            }
            const originalAttributeArray = originalAttribute.array;
            const { itemSize, normalized } = originalAttribute;
            const newAttributeArray = new originalAttributeArray.constructor(newIndexOriginalIndexMap.length * itemSize);
            newIndexOriginalIndexMap.forEach((originalIndex, i) => {
                for (let j = 0; j < itemSize; j++) {
                    newAttributeArray[i * itemSize + j] = originalAttributeArray[originalIndex * itemSize + j];
                }
            });
            newGeometry.setAttribute(attributeName, new BufferAttribute(newAttributeArray, itemSize, normalized));
        });
        
        let isNullMorph = true;
        Object.keys(geometry.morphAttributes).forEach((attributeName) => {
            newGeometry.morphAttributes[attributeName] = [];
            const morphs = geometry.morphAttributes[attributeName];
            for (let iMorph = 0; iMorph < morphs.length; iMorph++) {
                const originalAttribute = morphs[iMorph];
                if (originalAttribute.isInterleavedBufferAttribute) {
                    throw new Error('removeUnnecessaryVertices: InterleavedBufferAttribute is not supported');
                }
                const originalAttributeArray = originalAttribute.array;
                const { itemSize, normalized } = originalAttribute;
                const newAttributeArray = new originalAttributeArray.constructor(newIndexOriginalIndexMap.length * itemSize);
                newIndexOriginalIndexMap.forEach((originalIndex, i) => {
                    for (let j = 0; j < itemSize; j++) {
                        newAttributeArray[i * itemSize + j] = originalAttributeArray[originalIndex * itemSize + j];
                    }
                });
                isNullMorph = isNullMorph && newAttributeArray.every((v) => v === 0);
                newGeometry.morphAttributes[attributeName][iMorph] = new BufferAttribute(newAttributeArray, itemSize, normalized);
            }
        });
        if (isNullMorph) {
            newGeometry.morphAttributes = {};
        }
        mesh.geometry = newGeometry;
    });
    Array.from(geometryMap.keys()).forEach((originalGeometry) => {
        originalGeometry.dispose();
    });
}


function rotateVRM0(vrm) {
    var _a;
    if (((_a = vrm.meta) === null || _a === void 0 ? void 0 : _a.metaVersion) === '0') {
        vrm.scene.rotation.y = Math.PI;
    }
}

class VRMUtils {
    constructor() {
    }
}
VRMUtils.deepDispose = deepDispose;
VRMUtils.removeUnnecessaryJoints = removeUnnecessaryJoints;
VRMUtils.removeUnnecessaryVertices = removeUnnecessaryVertices;
VRMUtils.rotateVRM0 = rotateVRM0;

export { MToonMaterial, MToonMaterialDebugMode, MToonMaterialLoaderPlugin, MToonMaterialOutlineWidthMode, VRM, VRMAimConstraint, VRMCore, VRMCoreLoaderPlugin, VRMExpression, VRMExpressionLoaderPlugin, VRMExpressionManager, VRMExpressionMaterialColorBind, VRMExpressionMaterialColorType, VRMExpressionMorphTargetBind, VRMExpressionOverrideType, VRMExpressionPresetName, VRMExpressionTextureTransformBind, VRMFirstPerson, VRMFirstPersonLoaderPlugin, VRMFirstPersonMeshAnnotationType, VRMHumanBoneList, VRMHumanBoneName, VRMHumanBoneParentMap, VRMHumanoid, VRMHumanoidHelper, VRMHumanoidLoaderPlugin, VRMLoaderPlugin, VRMLookAt, VRMLookAtBoneApplier, VRMLookAtExpressionApplier, VRMLookAtHelper, VRMLookAtLoaderPlugin, VRMLookAtRangeMap, VRMLookAtTypeName, VRMMetaLoaderPlugin, VRMNodeConstraint, VRMNodeConstraintHelper, VRMNodeConstraintLoaderPlugin, VRMNodeConstraintManager, VRMRequiredHumanBoneName, VRMRollConstraint, VRMRotationConstraint, VRMSpringBoneCollider, VRMSpringBoneColliderHelper, VRMSpringBoneColliderShape, VRMSpringBoneColliderShapeCapsule, VRMSpringBoneColliderShapeSphere, VRMSpringBoneJoint, VRMSpringBoneJointHelper, VRMSpringBoneLoaderPlugin, VRMSpringBoneManager, VRMUtils };
