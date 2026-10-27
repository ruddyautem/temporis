import { test, expect, mock } from 'bun:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let completeRequest, navigations, errors, onNavigation, onError;
mock.module('next/navigation',()=>({useRouter:()=>({replace:url=>{navigations.push(url);onNavigation?.();}})}));
mock.module('@/lib/client',()=>({createRoomConnection:id=>({id,api:{room:{delete:()=>new Promise(resolve=>{completeRequest=resolve;}),leave:{post:async()=>({})}}}})}));
mock.module('sonner',()=>({toast:{dismiss(){},error:message=>{errors.push(message);onError?.();}}}));
const {useRoomSession}=await import('./use-room-session');

function setup() {
  navigations=[];errors=[];onNavigation=undefined;onError=undefined;
  let session;
  const queryClient=new QueryClient({defaultOptions:{mutations:{retry:false}}});
  function Probe(){session=useRoomSession('r'.repeat(21),'Fixture','g'.repeat(21));return React.createElement('div');}
  renderToString(React.createElement(QueryClientProvider,{client:queryClient},React.createElement(Probe)));
  return {session,queryClient};
}

test('successful DELETE exits immediately without any realtime event',async()=>{
  const {session,queryClient}=setup();
  const navigated=new Promise(resolve=>{onNavigation=resolve;});
  session.destroyRoom();
  await Promise.resolve();await Promise.resolve();
  expect(navigations).toEqual([]);
  completeRequest({status:200,error:null,data:{success:true}});
  await navigated;
  expect(navigations).toEqual(['/?destroyed=true']);expect(errors).toEqual([]);
  queryClient.clear();
});
test('a real deletion failure preserves the room and reports the error',async()=>{
  const {session,queryClient}=setup();
  const failed=new Promise(resolve=>{onError=resolve;});
  session.destroyRoom();
  await Promise.resolve();await Promise.resolve();
  completeRequest({status:500,error:{value:'Redis unavailable'}});
  await failed;
  expect(navigations).toEqual([]);expect(errors).toEqual(['Échec de la fermeture de la room.']);
  queryClient.clear();
});
