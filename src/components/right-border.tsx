export default function AddRightBorder( {children }: {children: React.ReactNode} ) {
    return <div className="pr-2 border-r-8 rounded-md border-gray-200">{children}</div>
}

export function AddFullBorder( {children }: {children: React.ReactNode} ) {
    return <div className="p-2 border-8 rounded-md border-gray-200">{children}</div>
}

export function AddTopBorder( {children }: {children: React.ReactNode} ) {
    return <div className="pt-2 border-t-8 rounded-md border-gray-200">{children}</div>
}

export function AddBottomBorder( {children }: {children: React.ReactNode} ) {
    return <div className="pb-2 border-b-8 rounded-md border-gray-200">{children}</div>
}