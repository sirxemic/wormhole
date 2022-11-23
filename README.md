# Wormhole simulation

Experience the space time curvature and strange lensing effects of a 3D wormhole in your browser.

## Mathematical details

In this simulation you see the curvature of an Ellis wormhole with a throat.

The metric used to trace all light rays is

$ds^2=dl^2+(k^2+x^2)(d\theta^2+sin^2 \theta\ d\varphi^2)$

where

$x=\max(0, |l| - a)$\
$k$ = the wormhole's interior's radius\
$a$ = half the throat's length.

Due to the spherical symmetry, instead of integrating the light rays in spherical coordinates, they are first projected onto a 2D plane through the origin and integrated in 2D space (using metric $ds^2=dl^2+(k^2+x^2)d\theta^2$). 

## Credits

The skyboxes were made using [Space Engine](http://spaceengine.org/).
