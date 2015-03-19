// --------------------------------------------------------------------matrix
function decompose(str) {
    var a = str.match(/matrix\(.*?\)/g)[0].replace(/matrix\(|\)/g,'').split(', ');

    var d11 = parseFloat(a[0]), d12 = parseFloat(a[2]), d13 = parseFloat(a[4]),
        d21 = parseFloat(a[1]), d22 = parseFloat(a[3]), d23 = parseFloat(a[5]);

    var translate = {x:d13, y:d23};
    var scale = {x: 1, y: 1};
    var rotation = 0;
    var skew = {x: 0, y: 0};

    var determ = d11 * d22 - d21 * d12;
    if (d11 || d21) {
        var r = Math.sqrt(d11*d11 + d21*d21);
        rotation = d21 > 0 ? Math.acos(d11/r) : -Math.acos(d11/r);
        scale = {x:r, y:determ/r};
        skew.x = Math.atan((d11*d12 + d21*d22) / (r*r));
    }
    else if (d12 || d22) {
        var s = Math.sqrt(d12*d12 + d22*d22);
        rotation = Math.PI * 0.5 - (d22 > 0 ? Math.acos(-d12/s) : -Math.acos(d12/s));
        scale = {x:determ/s, y:s};
        skew.y = Math.atan((d11*d12 + d21*d22) / (s*s));
    }
    else {
        scale = {x:0, y:0};
    }

    return {
        scale    : scale,
        translate: translate,
        rotation : rotation,
        skew     : skew
    };
}

function decompose3d(str) {
    var a = str.match(/matrix3d\(.*?\)/g)[0].replace(/matrix3d\(|\)/g,'').split(', ');

    var d11 = parseFloat(a[0]), d12 = parseFloat(a[4]), d13 = parseFloat(a[8]), d14 = parseFloat(a[12]),
        d21 = parseFloat(a[1]), d22 = parseFloat(a[5]), d23 = parseFloat(a[9]), d24 = parseFloat(a[13]),
        d31 = parseFloat(a[2]), d32 = parseFloat(a[6]), d33 = parseFloat(a[10]), d34 = parseFloat(a[14]);

    var translate = {x:d14, y:d24, z:d34};

    var scaleX = Math.sqrt(d11 * d11 + d21 * d21 + d31 * d31);
    var scaleY = Math.sqrt(d12 * d12 + d22 * d22 + d32 * d32);
    var scaleZ = Math.sqrt(d13 * d13 + d23 * d23 + d33 * d33);
    var scale = {x:scaleX, y:scaleY, z:scaleZ};

    if (0 < scaleX) {
        d11 /= scaleX;
        d21 /= scaleX;
        d31 /= scaleX;
    }
    if (0 < scaleY) {
        d12 /= scaleY;
        d22 /= scaleY;
        d32 /= scaleY;
    }
    if (0 < scaleZ) {
        d13 /= scaleZ;
        d23 /= scaleZ;
        d33 /= scaleZ;
    }
    var rotation;
    var rotateX, rotateY, rotateZ;
    var md31 = -d31;
    if (md31 <= -1) {
        rotateY = -Math.PI * 0.5;
    } else if (1 <= md31) {
        rotateY = Math.PI * 0.5;
    } else {
        rotateY = Math.asin(md31);
    }
    var cosY = Math.cos(rotateY);
    if (cosY <= 0.001) {
        rotateZ = 0;
        rotateX = Math.atan2(-d23, d22);
    } else {
        rotateZ = Math.atan2(d21, d11);
        rotateX = Math.atan2(d32, d33);
    }
    rotation = {x:rotateX/Math.PI*180, y:rotateY/Math.PI*180, z:rotateZ/Math.PI*180};

    return {
        scale    : scale,
        translate: translate,
        rotation : rotation
    };
}
