import Modal from "@/components/modal";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import Engine from "./core_engine";

type Props = {
    engine: Engine | undefined,
}

export const GamePad = ({engine}: Props) => {
    const [placingFences, setPlacingFences ] = useState(false)
    const [ moveArmed, setMoveArmed ] = useState(false)
    const [ giveupArmed, setGiveupArmed ] = useState(false)
    const engineRef = useRef(engine); // Store the initial value of `engine` in a ref
    const autoRotate = false;


    const warn = () => {console.error('the buttons are not active yet')};

    const doubleClick = (flag: boolean, setFlag: Dispatch<SetStateAction<boolean>> , func: any) => {
        if (flag) {
            func();
        } else {
            setFlag(true);
            setTimeout(() => setFlag(false), 5000);
        }
    }

    useEffect( () => {
        if (autoRotate) {
            const intervalId = setInterval(next, 1000);
            // Clear the interval and update engineRef when `engine` changes
            return () => {
                clearInterval(intervalId);
                engineRef.current = engine;
            };
        }
    }, [engine]);

    const prev   = engine ? () => engine.gameLogic.PreviousPlayerCursor()  : warn;
    const next   = engine ? () => engine.gameLogic.NextPlayerCursor()      : warn;
    const rotate = engine ? () => engine.gameLogic.nextCursorOrientation() : warn;
    const up     = engine ? () => engine.gameLogic.MoveCursorFront()       : warn;
    const down   = engine ? () => engine.gameLogic.MoveCursorBack()        : warn;
    const left   = engine ? () => engine.gameLogic.MoveCursorLeft()        : warn;
    const right  = engine ? () => engine.gameLogic.MoveCursorRight()       : warn;
    const commit = engine ? () => doubleClick( moveArmed, setMoveArmed, () => engine.gameLogic.commitMove() ) : warn;
    const giveup = engine ? () => doubleClick( giveupArmed, setGiveupArmed, () => engine.gameLogic.Giveup() ) : warn;

    const mode   = engine ? () =>
        {
            engine.gameLogic.switchCursorMode();
            setPlacingFences( !placingFences );
        } : warn;

    return <div className="grid grid-rows-3 grid-cols-3 gap-1">
        <button onClick={mode} className="border border-gray-200 text-gray-200 rounded-md flex h-10 w-full bg-theme-300">
            <p className="w-fit m-auto font-bold">
                MODE
            </p>
        </button>
        {placingFences ?
            <button onClick={up} className="border border-gray-200 text-gray-200 rounded-md h-10 w-full bg-theme-300">
                <svg className="m-auto h-[90%]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
                </svg>
            </button>
            : <div />}
        <button onClick={commit} className="bg-blue-800 border border-gray-200 text-gray-200 rounded-md flex h-10 w-full bg-theme-300">
            <p className="w-fit m-auto font-bold">
                { moveArmed ? 'COMMIT' :
                    placingFences ? 'PLACE' : 'MOVE'}
            </p>
        </button>
        {placingFences ?
            <button onClick={left} className={`border border-gray-200 text-gray-200 rounded-md h-10 w-full ${autoRotate ? 'invisible' : ''}`}>
                <svg className="m-auto h-[90%]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
                </svg>
            </button>
            : <div />}
        <button onClick={placingFences ? rotate : () => { if (!autoRotate) next()}} className="border border-gray-200 text-gray-200 rounded-md h-10 w-full">
            <svg className="m-auto h-[90%]" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={0} stroke="currentColor">
                <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
            </svg>
        </button>
        {placingFences ?
            <button onClick={right} className={`border border-gray-200 text-gray-200 rounded-md h-10 w-full ${autoRotate ? 'invisible' : ''}`}>
                <svg className="m-auto h-[90%]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
                </svg>
            </button> 
            : <div />}
        <div>
            <Modal />
        </div>
        {placingFences ?
            <button onClick={down} className="border border-gray-200 text-gray-200 rounded-md h-10 w-full">
                <svg className="m-auto h-[90%]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
                </svg>
            </button>
            : <div />}
        <button onClick={giveup} className="bg-blue-800 border border-gray-200 text-gray-200 rounded-md flex h-10 w-full">
            <p className="w-fit m-auto font-bold">
                { giveupArmed ? 'COMMIT' : 'GIVE UP'}
            </p>
        </button>
    </div>
}