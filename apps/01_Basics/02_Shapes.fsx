#r "nuget: Pxl, 0.0.1-preview.1"
open PxlLocalDevShadow

open System
open Pxl
open Pxl.Ui

let createCanvas = CanvasProxy.createWithDefaults "localhost"


// -------------------------------------------------------------



// ...or some rectangles ...
scene {
    let! ctx = getCtx()

    rect.xywh(2, 2, 20, 20).fill(Colors.blue)
    rect.xywh(4, 4, 16, 16).fill(Colors.white)

    oval.xywh(10, 10, 20, 20).fill(Colors.red)

    polygon
        .define(fun path ->
            path.MoveTo(f32 ctx.halfWidth + 0.5f, f32 ctx.height)
            path.LineTo(0f, 0f)
            path.LineTo(0f, f32 ctx.height)
            path.Close()
        )
        .fill(Colors.gray)

}
|> Simulator.start createCanvas


(*
Simulator.stop ()
*)
