#r "nuget: Pxl, 0.0.1-preview.2"

open System
open Pxl
open Pxl.Ui

let createCanvas = CanvasProxy.createWithDefaults "localhost"


// -------------------------------------------------------------


// idea: when the second value of "now" changes (only 1 frame for every second)
// and that change is a multiple of 2, we increment the counter

scene {
    let! count = useState { 0 }
    let! now = getNow()

    let! secChanged = Trigger.valueChanged now.Second
    if secChanged && now.Second % 2 = 0 then
        count.value <- count.value + 1

    text.mono6x6($"{count.value}").color(Colors.white)
}
|> Simulator.start createCanvas



(*
Simulator.stop ()
*)
