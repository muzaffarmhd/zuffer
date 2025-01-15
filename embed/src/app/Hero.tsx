import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export const Hero = () => {
    return (
        <div>
            <div className='w-full h-[35rem] items-center flex justify-center flex-col'>
                <Image className='rounded-lg' src="/logo.png" alt="Hero" width={160} height={160} />
                <div className="scale-75 lg:scale-100 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-full">
                    {/* Navigation container */}
                    <nav className="relative bg-[#000319] px-6 py-3 shadow-[8px_8px_0px_0px_#ffffff] border border-white">
                        <ul className="flex space-x-6">
                            {['Home', 'Configure', 'Embed', 'Discord', 'Docs', 'GitHub'].map((item) => (
                                <li key={item}>
                                    <Link
                                        href={`/${item.toLowerCase()}`}
                                        className="text-white hover:text-white hover:underline transition-colors duration-200 text-sm font-medium"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    )
}

