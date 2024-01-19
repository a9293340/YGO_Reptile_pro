const mongoose = require("mongoose");

const jurisprudence = new mongoose.Schema({
	number: { type: String, required: true, unique: true, index: true },
	name_jp_h: { type: String },
	name_jp_k: { type: String },
	name_en: { type: String },
	effect_jp: { type: String, required: true },
	jud_link: { type: String, required: true },
	info: { type: String },
	qa: [
		{
			title: { type: String, index: true },
			tag: { type: String },
			date: { type: String, index: true },
			q: { type: String },
			a: { type: String },
		},
	],
});

const admin = new mongoose.Schema({
	type: { type: Number, required: true },
	name: { type: String, required: true },
	create_date: { type: Date, required: true, default: Date.now },
	photo: { type: String },
	status: { type: Number, required: true },
	account: { type: String, unique: true, index: true, required: true },
	password: { type: String, required: true },
	email: { type: String, unique: true, required: true, index: true },
});

const series_introduction = new mongoose.Schema({
	type: { type: Number, required: true },
	title: { type: String, required: true, index: true },
	publish_date: { type: Date, required: true, default: Date.now },
	photo: { type: String },
	content: { type: String },
	status: { type: Number, required: true },
	to_top: { type: Boolean },
	admin_id: { type: String, required: true },
	tag: { type: Array },
});

const useful_card_introduction = new mongoose.Schema({
	type: { type: Number, required: true },
	title: { type: String, required: true, index: true },
	publish_date: { type: Date, required: true, default: Date.now },
	photo: { type: String },
	content: { type: String },
	status: { type: Number, required: true },
	to_top: { type: Boolean },
	admin_id: { type: String, required: true },
	tag: { type: Array },
});

const meta_deck = new mongoose.Schema({
	title: { type: String, required: true, index: true },
	publish_date: { type: Date, required: true, default: Date.now },
	photo: { type: String },
	content: { type: String },
	status: { type: Number, required: true },
	to_top: { type: Boolean },
	admin_id: { type: String, required: true },
	tag: { type: Array },
});

const product_information = new mongoose.Schema({
	type: { type: Number, required: true },
	title: { type: String, required: true, index: true },
	publish_date: { type: Date, required: true, default: Date.now },
	photo: { type: String },
	content: { type: String },
	status: { type: Number, required: true },
	to_top: { type: Boolean },
	admin_id: { type: String, required: true },
	tag: { type: Array },
});

const rules = new mongoose.Schema({
	type: { type: Number, required: true },
	title: { type: String, required: true, index: true },
	publish_date: { type: Date, required: true, default: Date.now },
	photo: { type: String },
	content: { type: String },
	status: { type: Number, required: true },
	to_top: { type: Boolean },
	admin_id: { type: String, required: true },
	tag: { type: Array },
});

const series_story = new mongoose.Schema({
	title: { type: String, required: true, index: true },
	publish_date: { type: Date, required: true, default: Date.now },
	photo: { type: String },
	content: { type: String },
	status: { type: Number, required: true },
	to_top: { type: Boolean },
	admin_id: { type: String, required: true },
	tag: { type: Array },
});

const battle_paper = new mongoose.Schema({
	type: { type: Number, required: true },
	title: { type: String, required: true, index: true },
	publish_date: { type: Date, required: true, default: Date.now },
	photo: { type: String },
	content: { type: String },
	status: { type: Number, required: true },
	to_top: { type: Boolean },
	admin_id: { type: String, required: true },
	tag: { type: Array },
});

const cards = new mongoose.Schema({
	number: { type: String, required: true, index: true },
	name: { type: String, required: true },
	type: { type: String, required: true },
	race: { type: String },
	star: { type: String },
	attribute: { type: String, required: true },
	rarity: { type: Array, required: true },
	atk: { type: Number },
	def: { type: Number },
	product_information_type: { type: String, required: true },
	effect: { type: String, required: true },
	price_info: [
		{
			time: { type: Date, required: true },
			rarity: { type: String, required: true },
			price_lowest: { type: Number, default: null },
			price_avg: { type: Number, default: null },
		},
	],
	price_yuyu: [
		{
			time: { type: Date, required: true },
			rarity: { type: String, required: true },
			price_lowest: { type: Number, default: null },
			price_avg: { type: Number, default: null },
		},
	],
	id: { type: String, required: true, index: true },
});

const cards_image = new mongoose.Schema({
	number: { type: String },
	photo: { type: String },
});

const decks = new mongoose.Schema({
	admin_id: { type: String, required: true },
	title: { type: String, required: true, index: true },
	create_date: { type: Date, required: true },
	last_edit_date: { type: Date, default: Date.now, required: true },
	main_deck: [
		{
			card_id: { type: String, required: true },
			card_rarity: { type: String, required: true },
		},
	],
	extra_deck: [
		{
			card_id: { type: String, required: true },
			card_rarity: { type: String, required: true },
		},
	],
	side_deck: [
		{
			card_id: { type: String, required: true },
			card_rarity: { type: String, required: true },
		},
	],
});

const calendar = new mongoose.Schema({
	title: { type: String, required: true, index: true },
	date: { type: Date, required: true, index: true },
	url: { type: String },
	type: { type: Number, required: true },
	content: { type: String },
});

const banner = new mongoose.Schema({
	title: { type: String, required: true, index: true },
	subtitle: { type: String },
	date: { type: Date, required: true },
	photo_pc: { type: String, required: true },
	photo_mobile: { type: String, required: true },
	url: { type: String },
});

const product_information_type = new mongoose.Schema({
	packType: { type: String, required: true, index: true, unique: true },
	mainType: { type: Number, required: true },
	status: { type: Number, required: true },
	name: { type: String, required: true, index: true },
});

const tag = new mongoose.Schema({
	tag: { type: String, required: true, unique: true, index: true },
});

const frontend_token = new mongoose.Schema({
	token: { type: String, required: true },
	date: { type: Date, required: true },
	tokenReq: { type: String, required: true },
});

const backend_token = new mongoose.Schema({
	token: { type: String, required: true },
	date: { type: Date, required: true },
	tokenReq: { type: String, required: true },
});

const permission = new mongoose.Schema({
	name: { type: String, required: true },
	permission: { type: Array },
	type: { type: Number, required: true },
});

module.exports = {
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
	permission,
	jurisprudence,
};
