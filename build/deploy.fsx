#r "nuget: FsHttp, 15.0.1"
#r "nuget: Spectre.Console, 0.48.1-preview.0.20"
#r "nuget: Spectre.Console.Cli, 0.48.1-preview.0.20"

[<RequireQualifiedAccess>]
module Console =
    open Spectre.Console

    let required x =
        match x with
        | [] -> failwith "Required value not provided"
        | x -> x

    let withDefault def x =
        match x with
        | Some x -> x
        | None -> def ()
    
    let selectMany title elements =
        let p =
            MultiSelectionPrompt<_>(
                PageSize = 10,
                Title = title,
                InstructionsText = "[grey](Press [blue]<space>[/] to toggle, [green]<enter>[/] to accept)[/]",
                Required = false,
                WrapAround = true
                )
                .UseConverter(fst)
                .AddChoices(elements |> Seq.toArray)
        
        p
        |> AnsiConsole.Prompt
        |> Seq.map snd
        |> Seq.toList

    let selectOne title elements =
        SelectionPrompt<_>(
            Title = title,
            WrapAround = true
            )
            .UseConverter(fst)
            .AddChoices(elements |> Seq.toArray)
            |> AnsiConsole.Prompt
            |> snd

    let selectMaybeOne title elements =
        [
            for a,b in elements do
                yield a, Choice1Of2 b
            yield "(enter manually ...)", Choice2Of2 ()
        ]
        |> selectOne title
        |>
            function
            | Choice1Of2 x -> Some x
            | Choice2Of2 _ -> None

    let askForValue title =
        TextPrompt<string>(title)
        |> AnsiConsole.Prompt

    let selectOneOrDefault title elements =
        elements
        |> selectMaybeOne title
        // |> withDefault (fun () -> input title)

open System
open System.IO
open FsHttp

module Steps =
    let deployImage (pxlClockAddr: string) (imageFileName: string) (duration: int) =
        http {
            config_timeoutInSeconds 60.0
            POST $"http://{pxlClockAddr}/daemon/dev/showImage?&duration={duration}"
            multipart
            filePart imageFileName (Path.GetFileName imageFileName)
        }
        |> Request.send
        |> Response.assert2xx
        |> ignore

    let deployApp (pxlClockAddr: string) (scriptFilePath: string) (assetFilePaths: string list) (duration: int) =
        let mutable req =
            http {
                config_timeoutInSeconds 240.0
                POST $"http://{pxlClockAddr}/daemon/dev/startApp?&duration={duration}"
                multipart
                textPart (File.ReadAllText(scriptFilePath)) "app.fsx" "app.fsx"
            }
        for assetFilePath in assetFilePaths do
            printfn $"adding asset: {assetFilePath}"
            req <- 
                req {
                    filePart assetFilePath ("assets/" + Path.GetFileName assetFilePath)
                }
        req
        |> Request.send
        |> Response.assert2xx
        |> ignore

    let askForDeviceAddress () =
        Console.askForValue "Enter the IP address or FQDN of the PxlClock device"

    let chooseFsxFile () =
        let fsxFiles = 
            let appDir = __SOURCE_DIRECTORY__ + "/../apps"
            Directory.GetFiles(appDir, "*.fsx", SearchOption.AllDirectories)
            |> Array.toList
            |> List.map (fun fileName -> 
                let displayName = fileName.Substring(appDir.Length + 1)
                displayName, fileName)
        Console.selectOne "Choose the app to deploy" fsxFiles

    let chooseAssets (scriptFile: string) =
        let scriptDir = Path.GetDirectoryName scriptFile
        let assetsDir = Path.Combine(scriptDir, "assets")
        let assetFiles = 
            Directory.GetFiles(assetsDir, "*.*", SearchOption.TopDirectoryOnly)
            |> Array.toList
            |> List.map (fun fileName -> 
                let displayName = Path.GetFileName fileName
                displayName, fileName)
        Console.selectMany "Choose assets" assetFiles

    let chooseSingleImageInRepo () =
        let imageFiles = 
            let appDir = __SOURCE_DIRECTORY__ + "/../apps"
            [ 
                "*.png"
                "*.gif"
                "*.jpg"
            ]
            |> List.map (fun ext -> 
                Directory.GetFiles(appDir, ext, SearchOption.AllDirectories)
                |> Array.toList
            )
            |> List.concat
            |> List.map (fun fileName -> 
                let displayName = fileName.Substring(appDir.Length + 1)
                displayName, fileName)
        Console.selectOne "Choose the image to display" imageFiles

    let askForFilePath () =
        Console.askForValue "Enter the full path to the file"

    let askForDuration () =
        let res = Console.askForValue "Enter the duration in seconds"
        match Int32.TryParse(res) with
        | (true, value) -> value
        | (false, _) -> failwith "Invalid duration. Please enter a valid integer."

module Workflows =
    let deployImage () =
        let fileName =
            match
                Console.selectOne "Upload Image" [
                    "Select file from repo", Choice1Of2 ()
                    "Enter file path", Choice2Of2 ()
                ]
            with
            | Choice1Of2 () -> Steps.chooseSingleImageInRepo ()
            | Choice2Of2 () -> Steps.askForFilePath ()
        if not (File.Exists fileName) then
            failwith $"File not found: {fileName}"
        let pxlClockAddr = Steps.askForDeviceAddress ()
        let duration = Steps.askForDuration ()
        Steps.deployImage pxlClockAddr fileName duration

    let deployApp () =
        let scriptFile = Steps.chooseFsxFile ()
        let assetFiles = Steps.chooseAssets scriptFile
        let pxlClockAddr = Steps.askForDeviceAddress ()
        let duration = Steps.askForDuration ()
        Steps.deployApp pxlClockAddr scriptFile assetFiles duration

    let chooseWorkflow () =
        Console.selectOne "Choose workflow" [
            "Deploy image", deployImage
            "Deploy app", deployApp
        ]


let args = fsi.CommandLineArgs |> Array.toList
printfn $"args = {args}"
let workflow =
    match args with
    | [ _ ] -> None
    | [ _; workflow ] -> Some workflow
    | _ -> failwith "Invalid arguments. Usage: dotnet fsi build/deploy.fsx -- [image|app]"

match workflow with
| Some "image" -> Workflows.deployImage ()
| Some "app" -> Workflows.deployApp ()
| Some x -> failwith $"Invalid workflow: {x}"
| None ->
    let workflow = Workflows.chooseWorkflow ()
    workflow ()

    

// Workflows.deployApp ()
// Workflows.deployImage ()

// let fsiTest () =
//     deployApp 
//         "192.168.178.52" 
//         (__SOURCE_DIRECTORY__ + "/../apps/ursEnzler/ursenzler_Mythen.fsx")
//         [
//             __SOURCE_DIRECTORY__ + "/../apps/ursEnzler/assets/ursenzler_Mythen.png"
//         ]
// fsiTest ()
