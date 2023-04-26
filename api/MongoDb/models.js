import mongoose from 'mongoose';

const admin = new mongoose.Schema({
  type: { type: Number },
  name: { type: String },
  create_date: { type: Date },
  photo: { type: String },
  status: { type: Number },
  account: { type: String },
  password: { type: String },
  email: { type: String },
});

const series_introduction = new mongoose.Schema({
  type: { type: Number },
  title: { type: String },
  publish_date: { type: Date },
  photo: { type: String },
  content: { type: String },
  status: { type: Number },
  to_top: { type: Boolean },
  admin_id: { type: String },
  author_name: { type: String },
  tag: { type: Array },
});

const useful_card_introduction = new mongoose.Schema({
  type: { type: Number },
  title: { type: String },
  publish_date: { type: Date },
  photo: { type: String },
  content: { type: String },
  status: { type: Number },
  to_top: { type: Boolean },
  admin_id: { type: String },
  author_name: { type: String },
  tag: { type: Array },
});

const meta_deck = new mongoose.Schema({
  type: { type: Number },
  title: { type: String },
  publish_date: { type: Date },
  photo: { type: String },
  content: { type: String },
  status: { type: Number },
  to_top: { type: Boolean },
  admin_id: { type: String },
  author_name: { type: String },
  tag: { type: Array },
});

const product_information = new mongoose.Schema({
  type: { type: Number },
  product_information_type_id: { type: Number },
  title: { type: String },
  publish_date: { type: Date },
  photo: { type: String },
  content: { type: String },
  status: { type: Number },
  to_top: { type: Boolean },
  admin_id: { type: String },
  author_name: { type: String },
  tag: { type: Array },
});

const rules = new mongoose.Schema({
  type: { type: Number },
  title: { type: String },
  publish_date: { type: Date },
  photo: { type: String },
  content: { type: String },
  status: { type: Number },
  to_top: { type: Boolean },
  admin_id: { type: String },
  author_name: { type: String },
  tag: { type: Array },
});

const series_story = new mongoose.Schema({
  title: { type: String },
  publish_date: { type: Date },
  photo: { type: String },
  content: { type: String },
  status: { type: Number },
  to_top: { type: Boolean },
  admin_id: { type: String },
  author_name: { type: String },
  tag: { type: Array },
});

const battle_paper = new mongoose.Schema({
  type: { type: Number },
  title: { type: String },
  publish_date: { type: Date },
  photo: { type: String },
  content: { type: String },
  status: { type: Number },
  to_top: { type: Boolean },
  admin_id: { type: String },
  author_name: { type: String },
  tag: { type: Array },
});

const cards = new mongoose.Schema({
  number: { type: String },
  name: { type: String },
  type: { type: String },
  race: { type: String },
  star: { type: String },
  attribute: { type: String },
  rarity: { type: Array },
  atk: { type: Number },
  def: { type: Number },
  product_information_type: { type: String },
  effect: { type: String },
  photo: { type: String },
  price_info: { type: Array },
  price_yuyu: { type: Array },
  id: { type: String },
});

const cards_image = new mongoose.Schema({
  number: { type: String },
  photo: { type: String },
});

const decks = new mongoose.Schema({
  admin_id: { type: String },
  author_name: { type: String },
  title: { type: String },
  create_date: { type: Date },
  main_deck: { type: Array },
  extra_deck: { type: Array },
  side_deck: { type: Array },
});

const calendar = new mongoose.Schema({
  title: { type: String },
  date: { type: Date },
  url: { type: String },
  type: { type: Number },
});

const banner = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  date: { type: Date },
  photo_pc: { type: String },
  photo_mobile: { type: String },
  url: { type: String },
});

const product_information_type = new mongoose.Schema({
  packType: { type: String },
  subtype: { type: String },
  maintype: { type: Number },
  status: { type: Number },
  name: { type: String },
});

const tag = new mongoose.Schema({
  tag: { type: String },
});

const frontend_token = new mongoose.Schema({
  token: { type: String },
  date: { type: Date },
  tokenReq: { type: String },
});

const backend_token = new mongoose.Schema({
  token: { type: String },
  date: { type: Date },
  tokenReq: { type: String },
});

export default {
  admin,
  series_introduction,
  useful_card_introduction,
  meta_deck,
  product_information,
  rules,
  series_story,
  battle_paper,
  cards,
  decks,
  calendar,
  banner,
  product_information_type,
  tag,
  frontend_token,
  backend_token,
  cards_image,
};
