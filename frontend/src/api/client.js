import axios from 'axios';

export const API_ORIGIN=(import.meta.env.VITE_API_ORIGIN||window.location.origin).replace(/\/$/,'');

export const api=axios.create({
  baseURL:`${API_ORIGIN}/api`,
  withCredentials:true,
  withXSRFToken:true,
  headers:{
    Accept:'application/json',
    'X-Requested-With':'XMLHttpRequest'
  }
});

export async function csrf(){
  await axios.get(`${API_ORIGIN}/sanctum/csrf-cookie`,{
    withCredentials:true,
    withXSRFToken:true,
    headers:{
      Accept:'application/json',
      'X-Requested-With':'XMLHttpRequest'
    }
  });
}

export function asset(path){
  if(!path)return '';
  if(/^https?:\/\//.test(path))return path;
  return `${API_ORIGIN}/storage/${String(path).replace(/^\//,'')}`;
}

export function messageFrom(error){
  const d=error?.response?.data;
  if(d?.errors)return Object.values(d.errors).flat().join(' ');
  return d?.message||error?.message||'Something went wrong.';
}