import { api } from "../../lib";

const getItems = async () => {
  const { data } = await api.get('/items');

  return data;
};

const addItem = async (item: { name: string; url: string }) => {
  const { data } = await api.post('/items', item);

  return data;
};

const deleteItem = async (_id: string) => {
  const { data } = await api.delete('/items', { data: { "id": _id } });

  return data;
};

export const itemsApi = {
  getItems,
  addItem,
  deleteItem,
};