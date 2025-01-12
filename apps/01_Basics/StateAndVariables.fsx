#r "nuget: Pxl, 0.0.1-preview.1"
open PxlLocalDevShadow

open System
open Pxl
open Pxl.Ui

let createCanvas = CanvasProxy.createWithDefaults "localhost"


// -------------------------------------------------------------




// A simple counter with a state variable
scene {
    // Here, we declare a variable with initial value 0
    let! count = useState { 0 }

    text.mono6x6($"{count.value}").color(Colors.white)

    // In every frame, we increment the counter
    do count.value <- count.value + 1
}
|> Simulator.start createCanvas



(*
Simulator.stop ()
*)
