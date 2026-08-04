export type Defaults = {
    topMargin:number,
    bottomMargin:number,
    leftMargin:number,
    rightMargin:number,
    defaultStripHeight:number
    inactiveButtonColor:string
    readyButtonColor:string
    overButtonColor:string
    busyButtonColor:string
    failButtonColor:string

}
export const defaults:Defaults = {
    topMargin:10,
    bottomMargin:10,
    leftMargin:10,
    rightMargin:10,
    defaultStripHeight:20,
    inactiveButtonColor:'gray',
    readyButtonColor:'black',
    overButtonColor:'purple',
    busyButtonColor:'orange',
    failButtonColor:'red'   
}