import { useEffect, useState } from "react"

export function DecorativeCircles() {
   return <div className="flex items-center justify-center">
            <div className="my-4 mx-2 bg-gray-200 w-5 h-5 rounded-full" />
            <div className="my-4 mx-2 bg-gray-200 w-10 h-10 rounded-full" />
            <div className="my-4 mx-2 bg-gray-200 w-5 h-5 rounded-full" />
        </div>
}

type Props = {
    prefix?: string,
    children: JSX.Element
}

export const SlashCandy = ({ prefix = '///', children }: Props) => {
    return <>
        <div className="font-display flex">
            <span className="flex-fit text-gray-500">{prefix}</span>
            <span className="flex-initial">{children}</span>
            <span className="flex-fit text-gray-500 overflow-x-hidden">///////////////////////////////////////////////////////////</span>
        </div>
    </>
}

export const AnimatedSpan = ({ className, length, magic }: { className?: string, length: number, magic: number }) => {

    const [frame, setFrame] = useState(0);

    useEffect(() => {
        let forward = true;
        const interval = setInterval(() => {
            setFrame((frame) => {
                if (frame >= length) {
                    forward = false;
                } else if (frame <= 0) {
                    forward = true;
                }

                return forward ? frame + 1 : frame - 1
            }
            )
        }, magic)

        return () => clearInterval(interval);
    }, [])

    return <span className={`${className} w-max`}>{'/'.repeat(frame)}</span>
}

export const AnimatedCandy = () => {
    return <div className="font-display flex overflow-x-hidden">
        <AnimatedSpan className="text-gray-500" length={40} magic={112} />
        <AnimatedSpan length={40} magic={43} />
        <span className="flex-fit text-gray-500">///////////////////////////////////////////////////////////</span>
    </div>
}