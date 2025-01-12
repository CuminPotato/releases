#r "nuget: Pxl, 0.0.1-preview.2"

open System
open Pxl
open Pxl.Ui

let createCanvas = CanvasProxy.createWithDefaults "localhost"


// -------------------------------------------------------------



// Iterating and yielding (stateful) components
// also works in a nested way.
scene {
    bg(Colors.darkBlue)
    for x in 0..4 do
        for y in 0..4 do
            rect.xywh(x*4, y*4, 1, 1).fill(Colors.blue)
}
|> Simulator.start createCanvas



(*
Simulator.stop ()
*)
