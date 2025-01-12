
#r "nuget: FsHttp"

open FsHttp
open FsHttp.Operators

type Frame = { w: int; h: int; pixels: string[] }

let clear w h colorAsString =
    {
        w = w
        h = h
        pixels =
            [|
                for y in 0..h-1 do
                    for x in 0..w-1 do
                        yield colorAsString
            |]
    }

let setPxl x y colorAsString frame =
    do frame.pixels[x + y * frame.w] <- colorAsString
    frame

let printFrame frame =
    for y in 0..frame.h-1 do
        for x in 0..frame.w-1 do
            printf "%s " frame.pixels[x + y * frame.w]
        printfn ""
    frame

let send frame =
    http {
        POST "http://zero2w:3000/pushFrame"
        body
        json (
            let quot = "\""
            frame.pixels
            |> Array.map (fun p -> quot + p + quot)
            |> String.concat ", "
            |> sprintf "[%s]"
        )
    }
    |> Request.send


// -------------------------------------------------------------
// -------------------------------------------------------------


// this requires a 24x24 remote display
clear 24 24 "#000000"
|> setPxl 0 0 "#ff0000"
|> setPxl 2 0 "#0000ff"
|> setPxl 0 2 "#00ff00"
|> setPxl 2 2 "#ffff00"
|> printFrame
|> send

