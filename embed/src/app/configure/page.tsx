'use client';
import { getBotData } from '@/app/actions'
import { useState, useEffect } from 'react'
import InputForm from './InputForm'
import BotInfo from './bot-info'

export default async function Home() {
  const [ dataSaved, setDataSaved ] = useState(false);
  let hasToken = false;
  let botData = { displayName: '', avatarURL: '', description: '' };
  useEffect(() => {
    const loadBotData = () => {
      const data = getBotData();
      if (data.hasToken) {
        hasToken = true;
        botData = data.botData;
        setDataSaved(true);
      }
    }
    loadBotData();
  });
  return (
    <main className="flex w-full flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-md items-center justify-between font-mono text-sm">
        {dataSaved ? (
          <BotInfo displayName={botData.displayName} avatar={botData.avatarURL} description={botData.description} />
        ) : (
          <InputForm />
        )}
      </div>
    </main>
  )
}

