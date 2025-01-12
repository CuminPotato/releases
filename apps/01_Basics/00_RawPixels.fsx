#r "nuget: Pxl, 0.0.1-preview.2"

open System
open Pxl
open Pxl.Ui

let createCanvas = CanvasProxy.createWithDefaults "localhost"


// -------------------------------------------------------------


// TODO: We have bug in here, so please be patient - we will fix it soon
// and update the repository. Thank you!
let finalScene =
    scene {
        text.var4x5("abc").color(Colors.white)

        let! pixels = pxls.get()
        pixels.GetHashCode() |> printfn "pixels: %A"

        // from white to dark blue
        for i in 0..pixels.Length - 1 do
            let color = pixels[i].brightness(0.9)
            pixels[i] <- color
        
        pxls.set(pixels)
        
        text.var4x5("1").color(Colors.white)
    }


finalScene |> Simulator.start createCanvas

(*
Simulator.stop ()
*)

