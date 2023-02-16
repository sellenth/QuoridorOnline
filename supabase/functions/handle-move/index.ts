// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { writeAllSync } from 'https://deno.land/std@0.177.0/streams/write_all.ts'

const fence = new TextEncoder().encode('1')
const no_fence = new TextEncoder().encode('0')
//const player = new TextEncoder().encode('P')
const empty = new TextEncoder().encode(' ')
const newline = new TextEncoder().encode('\n')
const tab = new TextEncoder().encode('\t')

serve(async (req: any) => {
  // required for invoking from browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    // Now we can get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "user doesn't exist" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const body = await req.json()

    // Get the game record
    const { data, error } = await supabaseClient
      .from('games')
      .select('*')
      .eq('id', body.game_id)
      .single()
    if (error) throw error

    // if the move list length is even, that means it is player 2's turn
    const p2_move = !!(data.moves.length % 2)
    console.log(data.moves)
    console.log(data.moves.length)

    // reject a move from anyone but current player
    if (
      (p2_move && data.p2_id != user.id) ||
      (!p2_move && data.p1_id != user.id)
    ) {
      return new Response(
        JSON.stringify({ error: "you aren't the current player" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    let gameSpace = generateGameSpace()
    data.moves.forEach((move: any) => {
      if (move[0] != 0) {
        addFenceToGameSpace(gameSpace, move)
      }
    })
    writeGameSpaceToConsole(gameSpace)

    return new Response(JSON.stringify({ user, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

function generateGameSpace() {
  let gameSpace: number[][][] = []
  for (let x = 0; x < 18; ++x) {
    gameSpace.push([])
    for (let y = 0; y < 6; ++y) {
      gameSpace[x].push([])
      for (let z = 0; z < 18; ++z) {
        gameSpace[x][y].push(0)
      }
    }
  }
  return gameSpace
}

function addFenceToGameSpace(
  gameState: number[][][],
  fence: [number, number, number, number]
) {
  let orientation = fence[0]

  let offsets = [0, 1, 2]
  offsets.forEach((offset: number) => {
    offsets.forEach((offsetPrime: number) => {
      let x = fence[1]
      let y = fence[2]
      let z = fence[3]
      switch (orientation) {
        case 1: //horiz
          x += offset
          y += offsetPrime
          break
        case 2: // vertical
          y += offset
          z += offsetPrime
          break
        case 3: //flat
          x += offset
          z += offsetPrime
          break
      }

      gameState[x][y][z] = 1
    })
  })
}

function inBounds([x, y, z]: [number, number, number]) {
  return x >= 0 && x < 18 && y >= 0 && y < 6 && z >= 0 && z < 18
}

function writeGameSpaceToConsole(gameSpace: number[][][]) {
  for (let z = 17; z >= 0; --z) {
    for (let y = 0; y < 6; ++y) {
      for (let x = 0; x < 18; ++x) {
        if (gameSpace[x][y][z] == 1) {
          writeAllSync(Deno.stdout, fence)
        } else {
          if (y % 2 || x % 2 || z % 2) {
            writeAllSync(Deno.stdout, empty)
          } else {
            writeAllSync(Deno.stdout, no_fence)
          }
        }
      }
      writeAllSync(Deno.stdout, tab)
    }
    writeAllSync(Deno.stdout, newline)
  }
}
