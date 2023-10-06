import React from "react";

export default function Modal() {
  const [showModal, setShowModal] = React.useState(false);
  return (
        <>
            <button onClick={() => setShowModal(true)} className="border border-gray-200 text-gray-200 rounded-md h-10 w-full">
                <svg className="m-auto h-[60%]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
            </button>
            {showModal ? (
                <>
                    <div
                        className="justify-center bg-black/[0.5] items-center flex overflow-hidden flow-y-hidden fixed inset-0 z-50 outline-none focus:outline-none"
                    >
                        <div className="relative w-auto my-2 md:my-6 mx-auto max-w-3xl">
                            {/*content*/}
                            <div className="border border-gray-200 shadow-lg relative flex flex-col w-full bg-theme-300 outline-none focus:outline-none">
                                {/*header*/}
                                <div className="flex items-start justify-between py-2 px-5 border-b border-solid border-slate-200 rounded-t">
                                    <h3 className="text-3xl font-display text-gray-200">
                                        INSTRUCTIONS
                                    </h3>
                                </div>
                                <div className="relative py-2 px-6 flex-auto">
                                    <ul className="list-disc my-4 text-gray-200 text-sm md:text-lg leading-relaxed">
                                        <li>
                                            The main objective in <a className="underline" href="https://en.wikipedia.org/wiki/Quoridor">Quoridor</a> is to move your pawn to your opponent&apos;s side of the board.
                                        </li>
                                        <li>
                                            To prevent your opponent from reaching your side of the board, you can place fences to block their path.
                                        </li>
                                        <li>
                                            Fences cannot intersect each other.
                                        </li>
                                        <li>
                                            Fences cannot be placed in a way that would block a player from reaching their goal zone.
                                        </li>
                                        <li>
                                            The game board will pulse purple when it is your turn to play.
                                        </li>
                                        <li>
                                            In a 2D game, you will be shown a gamepad at the bottom of your screen. The <span className="font-bold">MODE</span> button will
                                            change between pawn and fence mode. The <span className="font-bold">COMMIT</span> button will play your move.
                                        </li>
                                        <li>
                                            The arrow buttons will change your pawn or fence position, depending on the mode.
                                        </li>
                                        <li>
                                            If it is your move and you are directly adjacent to your opponent, you may jump over them.
                                        </li>
                                        <li>
                                            If leapfrogging would result in jumping over a fence, try again to the left or right.
                                        </li>
                                    </ul>
                                    <div className="w-full flex">
                                        <button
                                            className="ml-auto text-gray-200 text-lg font-display my-2 shadow-lg hover:bg-theme-200 uppercase hover:shadow-theme-200/50 border-2 rounded-md border-theme-200 py-1 px-2"
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
                </>
            ) : null}
        </>
    );
}